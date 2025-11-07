const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. CONEXIÓN A SQLITE Y CREACIÓN DE TODAS LAS TABLAS ---
const dbPath = path.resolve(__dirname, 'negocio.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error abriendo la base de datos:", err.message);
    } else {
        console.log("Conectado a la base de datos SQLite.");
        
        db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
            if (pragmaErr) console.error("Error al activar foreign keys:", pragmaErr.message);
            else console.log("Foreign keys activadas.");
        });

        db.serialize(() => {
            // --- TUS TABLAS (CON MEJORAS) ---
            db.run(`CREATE TABLE IF NOT EXISTS USUARIO (
                usuario_id INTEGER PRIMARY KEY AUTOINCREMENT,
                rut_usuario TEXT NOT NULL,
                nombre_usuario TEXT NOT NULL,
                correo TEXT NOT NULL UNIQUE,
                clave TEXT NOT NULL,
                rol INTEGER NOT NULL
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS TIPOS_NEGOCIO (
                tipo_neg_id INTEGER PRIMARY KEY AUTOINCREMENT, 
                nombre_tipo TEXT NOT NULL UNIQUE
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS CATEGORIA_PRODUCTO (
                categoria_prod_id INTEGER PRIMARY KEY,
                nombre_categoria TEXT NOT NULL
            )`);

            // --- ¡TABLA ACTUALIZADA! ---
            db.run(`CREATE TABLE IF NOT EXISTS NOMBRE_PRODUCTO (
                producto_id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_producto TEXT NOT NULL,
                imagen_url TEXT, 
                categoria_prod_id INTEGER,
                FOREIGN KEY (categoria_prod_id) REFERENCES CATEGORIA_PRODUCTO (categoria_prod_id)
            )`);

            // --- ¡TABLA ACTUALIZADA! ---
            db.run(`CREATE TABLE IF NOT EXISTS PRODUCTO_EN_VENTA (
                producto_venta_id INTEGER PRIMARY KEY AUTOINCREMENT,
                precio_base INTEGER NOT NULL,
                stock_disponible INTEGER NOT NULL,
                unidad TEXT DEFAULT '',
                porcentaje_descuento INTEGER DEFAULT 0,
                producto_id INTEGER,
                negocio_id INTEGER, 
                FOREIGN KEY (producto_id) REFERENCES NOMBRE_PRODUCTO (producto_id) ON DELETE CASCADE,
                FOREIGN KEY (negocio_id) REFERENCES NEGOCIO (negocio_id) ON DELETE CASCADE
            )`);

            // --- ¡TABLA ACTUALIZADA! ---
            db.run(`CREATE TABLE IF NOT EXISTS NEGOCIO (
                negocio_id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_negocio TEXT NOT NULL,
                direccion_negocio TEXT NOT NULL,
                latitud REAL NOT NULL,
                longitud REAL NOT NULL,
                usuario_id INTEGER UNIQUE,
                tipo_neg_id INTEGER,
                FOREIGN KEY (usuario_id) REFERENCES USUARIO (usuario_id) ON DELETE CASCADE,
                FOREIGN KEY (tipo_neg_id) REFERENCES TIPOS_NEGOCIO (tipo_neg_id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS PEDIDO (
                pedido_id INTEGER PRIMARY KEY,
                monto_total INTEGER NOT NULL,
                direccion_negocio TEXT NOT NULL,
                usuario_id INTEGER,
                negocio_id INTEGER,
                FOREIGN KEY (usuario_id) REFERENCES USUARIO (usuario_id),
                FOREIGN KEY (negocio_id) REFERENCES NEGOCIO (negocio_id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS DETALLE_PEDIDO (
                detalle_id INTEGER PRIMARY KEY,
                cantidad INTEGER NOT NULL,
                direccion_negocio TEXT NOT NULL,
                pedido_id INTEGER,
                producto_venta_id INTEGER,
                FOREIGN KEY (pedido_id) REFERENCES PEDIDO (pedido_id),
                FOREIGN KEY (producto_venta_id) REFERENCES PRODUCTO_EN_VENTA (producto_venta_id)
            )`);
            
            console.log("Estructura de tablas asegurada/creada correctamente.");

            // Poblar TIPOS_NEGOCIO
            db.get(`SELECT COUNT(*) as count FROM TIPOS_NEGOCIO`, (err, row) => {
                if (row.count === 0) {
                    console.log("Poblando la tabla TIPOS_NEGOCIO...");
                    const tipos = [
                        { id: 1, nombre: 'Verdulería' }, { id: 2, nombre: 'Panadería' },
                        { id: 3, nombre: 'Carnicería' }, { id: 4, nombre: 'Almacén' },
                        { id: 5, nombre: 'Botillería' }, { id: 6, nombre: 'Farmacia' },
                        { id: 7, nombre: 'Ferretería' }, { id: 8, nombre: 'Restaurante' },
                        { id: 9, nombre: 'Heladeria' }, { id: 10, nombre: 'Mascotas' }
                    ];
                    // Usamos el ID manual que definimos en el frontend
                    const stmt = db.prepare(`INSERT OR IGNORE INTO TIPOS_NEGOCIO (tipo_neg_id, nombre_tipo) VALUES (?, ?)`);
                    tipos.forEach(tipo => stmt.run(tipo.id, tipo.nombre));
                    stmt.finalize();
                }
            });
        });
    }
});

// Función 'db.run' envuelta en Promesa para usar 'await'
const dbRun = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

// --- 2. ENDPOINT DE REGISTRO (¡ACTUALIZADO!) ---
app.post('/api/registro-cliente', async (req, res) => {
    // Obtenemos todos los datos, incluyendo los nuevos
    const { 
        rut, nombre, email, password, rol, 
        nombre_negocio, tipo_negocio_id, otro_tipo_negocio 
    } = req.body;
    
    console.log('Recibiendo datos para registro:', req.body);

    if (!rut || !nombre || !email || !password || !rol) {
        return res.status(400).json({ msg: 'Faltan campos básicos requeridos.' });
    }
    
    let nuevoUsuarioId;
    try {
        // --- 1. INSERTAR USUARIO ---
        const sqlInsertUsuario = `INSERT INTO USUARIO (rut_usuario, nombre_usuario, correo, clave, rol) VALUES (?, ?, ?, ?, ?)`;
        nuevoUsuarioId = await dbRun(sqlInsertUsuario, [rut, nombre, email, password, rol]);

        // Si es un Cliente (rol 1), terminamos y respondemos.
        if (rol == 1) {
            return res.status(201).json({ msg: 'Usuario registrado con éxito', id: nuevoUsuarioId });
        }

        // --- 2. LÓGICA DE VENDEDOR (rol 2) ---
        if (rol == 2) {
            console.log(`Usuario es Vendedor (rol 2). Creando entrada en NEGOCIO para usuario_id: ${nuevoUsuarioId}`);

            if (!nombre_negocio || !tipo_negocio_id) {
                throw new Error('Faltan campos de negocio (nombre o tipo).');
            }

            let idDelTipoDeNegocio = tipo_negocio_id;

            // --- Lógica para "Otro" ---
            if (tipo_negocio_id === 'otro') {
                if (!otro_tipo_negocio) {
                    throw new Error('Debe especificar el tipo de negocio.');
                }
                
                try {
                    // Intenta insertar el nuevo tipo
                    const sqlInsertTipo = `INSERT INTO TIPOS_NEGOCIO (nombre_tipo) VALUES (?)`;
                    idDelTipoDeNegocio = await dbRun(sqlInsertTipo, [otro_tipo_negocio]);
                    console.log(`Nuevo tipo de negocio "${otro_tipo_negocio}" creado con ID: ${idDelTipoDeNegocio}`);
                } catch (errTipo) {
                    // Si falla por 'UNIQUE', busca el ID existente
                    if (errTipo.message.includes('UNIQUE constraint failed')) {
                        console.log('El tipo de negocio "Otro" ya existe, buscando ID...');
                        idDelTipoDeNegocio = await new Promise((resolve, reject) => {
                            db.get(`SELECT tipo_neg_id FROM TIPOS_NEGOCIO WHERE nombre_tipo = ?`, [otro_tipo_negocio], (errGet, row) => {
                                if (row) {
                                    resolve(row.tipo_neg_id);
                                } else {
                                    reject(errGet || new Error('Error al buscar tipo duplicado.'));
                                }
                            });
                        });
                    } else {
                        throw errTipo; // Lanza otro tipo de error
                    }
                }
            }
            // --- Fin Lógica "Otro" ---

            // --- 3. INSERTAR NEGOCIO ---
            const sqlInsertNegocio = `
                INSERT INTO NEGOCIO (nombre_negocio, direccion_negocio, latitud, longitud, usuario_id, tipo_neg_id) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const paramsNegocio = [
                nombre_negocio, 
                "Dirección no especificada", // El usuario la llenará después
                0.0, // Latitud por defecto
                0.0, // Longitud por defecto
                nuevoUsuarioId,
                idDelTipoDeNegocio
            ];

            await dbRun(sqlInsertNegocio, paramsNegocio);
            console.log(`Entrada en NEGOCIO creada para usuario_id: ${nuevoUsuarioId}`);
            res.status(201).json({ msg: 'Usuario y Negocio registrados con éxito', id: nuevoUsuarioId });
        }

    } catch (err) {
        // --- MANEJO DE ERRORES (ROLLBACK) ---
        console.error('Error en el proceso de registro:', err.message);
        
        // Si el usuario ya fue creado pero el negocio falló, borramos el usuario
        if (nuevoUsuarioId) {
            console.log(`Haciendo rollback, eliminando USUARIO con id: ${nuevoUsuarioId}`);
            db.run(`DELETE FROM USUARIO WHERE usuario_id = ?`, [nuevoUsuarioId]);
        }
        
        // Devolvemos mensajes de error específicos
        if (err.message.includes('UNIQUE constraint failed: USUARIO.correo')) {
            return res.status(409).json({ msg: 'El correo electrónico ya está registrado.' });
        }
        if (err.message.includes('UNIQUE constraint failed: NEGOCIO.usuario_id')) {
            return res.status(409).json({ msg: 'Este usuario ya tiene un negocio registrado.' });
        }
        return res.status(400).json({ msg: err.message });
    }
});

// --- 3. ENDPOINT DE LOGIN (¡ACTUALIZADO!) ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Por favor, envía email y contraseña.' });
    }
    
    const sql = `
        SELECT 
            u.usuario_id, u.nombre_usuario, u.correo, u.rol, u.clave,
            n.negocio_id, n.nombre_negocio,
            t.nombre_tipo 
        FROM USUARIO u
        LEFT JOIN NEGOCIO n ON u.usuario_id = n.usuario_id
        LEFT JOIN TIPOS_NEGOCIO t ON n.tipo_neg_id = t.tipo_neg_id
        WHERE u.correo = ?
    `;

    db.get(sql, [email], (err, user) => {
        if (err) {
            console.error('Error en login:', err.message);
            return res.status(500).json({ msg: 'Error en el servidor' });
        }
        if (!user || user.clave !== password) { // ¡Recuerda cambiar esto por bcrypt!
            return res.status(401).json({ msg: 'Credenciales incorrectas' });
        }

        const respuesta = {
            id: user.usuario_id, 
            nombre: user.nombre_usuario, 
            email: user.correo, 
            rol: user.rol,
            negocio: null
        };

        if (user.rol == 2 && user.negocio_id) {
            respuesta.negocio = {
                negocio_id: user.negocio_id,
                nombre_negocio: user.nombre_negocio,
                tipo_negocio: user.nombre_tipo || 'Tipo no definido' 
            };
        }

        res.status(200).json({ 
            msg: 'Login exitoso',
            usuario: respuesta 
        });
    });
});

// --- 4. ENDPOINT ACTUALIZAR UBICACIÓN NEGOCIO---
app.patch('/api/negocio/ubicacion', (req, res) => {
    const { lat, lng, usuarioId } = req.body;

    if (lat === undefined || lng === undefined || !usuarioId) {
        return res.status(400).json({ msg: 'Datos incompletos. Se requiere lat, lng y usuarioId.' });
    }

    const sql = `
        UPDATE NEGOCIO
        SET latitud = ?, 
            longitud = ?
        WHERE usuario_id = ? 
    `;
    
    const params = [lat, lng, usuarioId];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Error al actualizar la base de datos (NEGOCIO):', err.message);
            return res.status(500).json({ msg: 'Error interno del servidor', error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ msg: `No se encontró un negocio para el usuario_id ${usuarioId}` });
        }

        console.log(`Ubicación actualizada para usuario_id ${usuarioId}`);
        res.status(200).json({ msg: 'Ubicación actualizada con éxito' });
    });
});

// --- 5. ENDPOINT PARA OBTENER TODOS LOS NEGOCIOS---
app.get('/api/negocios', (req, res) => {
    const sql = `
        SELECT 
            n.negocio_id, n.nombre_negocio, n.direccion_negocio, n.latitud, n.longitud, n.usuario_id,
            t.nombre_tipo
        FROM NEGOCIO n
        LEFT JOIN TIPOS_NEGOCIO t ON n.tipo_neg_id = t.tipo_neg_id
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener negocios:', err.message);
            return res.status(500).json({ msg: 'Error interno del servidor', error: err.message });
        }
        
        res.status(200).json(rows);
    });
});

// --- 6. ENDPOINT PARA OBTENER LOS TIPOS DE NEGOCIO ---
app.get('/api/tipos-negocio', (req, res) => {
    const sql = `SELECT tipo_neg_id, nombre_tipo FROM TIPOS_NEGOCIO ORDER BY nombre_tipo`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener tipos de negocio:', err.message);
            return res.status(500).json({ msg: 'Error interno del servidor' });
        }
        res.status(200).json(rows);
    });
});

// --- 7. ENDPOINT PARA OBTENER TODOS LOS USUARIOS (para pruebas) ---
app.get('/api/usuarios', (req, res) => {
    const sql = `SELECT usuario_id, rut_usuario, nombre_usuario, correo, rol FROM USUARIO`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener usuarios:', err.message);
            return res.status(500).json({ msg: 'Error interno del servidor', error: err.message });
        }
        res.status(200).json(rows);
    });
});


// ==========================================================
// --- ¡NUEVOS ENDPOINTS PARA PRODUCTOS! ---
// ==========================================================

// 8. OBTENER productos de un negocio específico
app.get('/api/negocio/:negocio_id/productos', (req, res) => {
    const { negocio_id } = req.params;
    const sql = `
        SELECT 
            p.producto_venta_id, p.precio_base, p.stock_disponible, p.unidad, p.porcentaje_descuento,
            n.producto_id, n.nombre_producto, n.imagen_url
        FROM PRODUCTO_EN_VENTA p
        JOIN NOMBRE_PRODUCTO n ON p.producto_id = n.producto_id
        WHERE p.negocio_id = ?
    `;
    db.all(sql, [negocio_id], (err, rows) => {
        if (err) {
            res.status(500).json({ msg: "Error en el servidor", error: err.message });
        } else {
            res.status(200).json(rows);
        }
    });
});

// 9. AÑADIR un producto nuevo
app.post('/api/productos', async (req, res) => {
    const { nombre_producto, imagen_url, precio_base, stock_disponible, unidad, negocio_id } = req.body;
    if (!nombre_producto || !precio_base || !stock_disponible || !unidad || !negocio_id) {
        return res.status(400).json({ msg: "Faltan datos." });
    }

    try {
        // 1. Inserta en NOMBRE_PRODUCTO
        const sqlNombre = `INSERT INTO NOMBRE_PRODUCTO (nombre_producto, imagen_url) VALUES (?, ?)`;
        const nuevoProductoId = await dbRun(sqlNombre, [nombre_producto, imagen_url || null]);
        
        // 2. Inserta en PRODUCTO_EN_VENTA
        const sqlVenta = `
            INSERT INTO PRODUCTO_EN_VENTA (precio_base, stock_disponible, unidad, producto_id, negocio_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        const nuevoProductoVentaId = await dbRun(sqlVenta, [precio_base, stock_disponible, unidad, nuevoProductoId, negocio_id]);

        // Devolvemos el producto completo que acabamos de crear
        res.status(201).json({ 
            msg: "Producto creado con éxito", 
            producto_venta_id: nuevoProductoVentaId,
            producto_id: nuevoProductoId,
            nombre_producto,
            imagen_url: imagen_url || null,
            precio_base,
            stock_disponible,
            unidad,
            porcentaje_descuento: 0
        });

    } catch (err) {
        console.error("Error al crear producto:", err.message);
        res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
});

// 10. ACTUALIZAR un producto (Editar)
app.put('/api/productos/:producto_venta_id', (req, res) => {
    const { producto_venta_id } = req.params;
    const { nombre_producto, imagen_url, precio_base, stock_disponible, unidad, producto_id } = req.body;

    if (!nombre_producto || !precio_base || !stock_disponible || !unidad || !producto_id) {
        return res.status(400).json({ msg: "Faltan datos." });
    }
    
    // Usamos serialize para asegurar que una query termine antes que la otra
    db.serialize(() => {
        const sqlNombre = `
            UPDATE NOMBRE_PRODUCTO 
            SET nombre_producto = ?, imagen_url = ? 
            WHERE producto_id = ?
        `;
        db.run(sqlNombre, [nombre_producto, imagen_url || null, producto_id], (err) => {
            if (err) {
                console.error("Error actualizando NOMBRE_PRODUCTO:", err.message);
                return res.status(500).json({ msg: "Error actualizando nombre", error: err.message });
            }
        });

        const sqlVenta = `
            UPDATE PRODUCTO_EN_VENTA 
            SET precio_base = ?, stock_disponible = ?, unidad = ?
            WHERE producto_venta_id = ?
        `;
        db.run(sqlVenta, [precio_base, stock_disponible, unidad, producto_venta_id], function(err) {
            if (err) {
                console.error("Error actualizando PRODUCTO_EN_VENTA:", err.message);
                return res.status(500).json({ msg: "Error actualizando venta", error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ msg: "Producto en venta no encontrado" });
            }
            // Si todo sale bien, devolvemos el objeto actualizado
            res.status(200).json({ 
                msg: "Producto actualizado con éxito",
                ...req.body // Devolvemos el objeto que nos enviaron
            });
        });
    });
});

// 11. ELIMINAR un producto
// (Eliminamos de NOMBRE_PRODUCTO, y ON DELETE CASCADE se encarga de PRODUCTO_EN_VENTA)
app.delete('/api/productos/:producto_id', (req, res) => {
    const { producto_id } = req.params;
    const sql = `DELETE FROM NOMBRE_PRODUCTO WHERE producto_id = ?`;
    
    db.run(sql, [producto_id], function(err) {
        if (err) {
            console.error("Error eliminando NOMBRE_PRODUCTO:", err.message);
            return res.status(500).json({ msg: "Error en el servidor", error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ msg: "Producto no encontrado" });
        }
        res.status(200).json({ msg: "Producto eliminado con éxito" });
    });
});

// 12. ACTUALIZAR una OFERTA (descuento)
app.patch('/api/oferta/:producto_venta_id', (req, res) => {
    const { producto_venta_id } = req.params;
    const { porcentaje_descuento } = req.body;
    
    if (porcentaje_descuento === undefined) {
        return res.status(400).json({ msg: "Falta el porcentaje de descuento." });
    }

    const sql = `
        UPDATE PRODUCTO_EN_VENTA 
        SET porcentaje_descuento = ? 
        WHERE producto_venta_id = ?
    `;
    
    db.run(sql, [porcentaje_descuento, producto_venta_id], function(err) {
        if (err) {
            console.error("Error actualizando OFERTA:", err.message);
            return res.status(500).json({ msg: "Error en el servidor", error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ msg: "Producto no encontrado" });
        }
        res.status(200).json({ msg: "Oferta actualizada con éxito" });
    });
});


// ==========================================================


// --- 9. INICIAR EL SERVIDOR ---
const port = 3000;
app.listen(port, () => {
    console.log(`API (con SQLite) corriendo en http://localhost:${port}`);
});