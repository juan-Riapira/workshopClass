const express = require('express');
const oracledb = require('oracledb');
const cors =require("cors")
const {Issuer} = require('openid-client');

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization' ]
}));

const dbConfig = {
  user: "userunivalle",
  password: "123",
  connectString: "localhost:1521/XEPDB1"
};

const keycloakConfig = {
  serverUrl: "http://localhost:8082/",
  clientId: "02",
  clientSecret: "vnusnVmsK5YlCp9o8xTyuAwpgUqso5k0",
  realm: "Arquitectura"
};

let keycloakIssuer;
let keycloakClient;

async function initKeycloak() {
  try {
    // Importar dinámicamente openid-client
    const openidClient = await import('openid-client');
    console.log('Imported openid-client:', Object.keys(openidClient));

    // Intentar importar Issuer desde el submódulo
    const { Issuer } = openidClient; // Cambia esto si Issuer está en otro lugar

    if (!Issuer) {
      throw new Error('Issuer no encontrado en openid-client. Exports disponibles: ' + Object.keys(openidClient).join(', '));
    }

    keycloakIssuer = await Issuer.discover(`${keycloakConfig.serverUrl}realms/${keycloakConfig.realm}`);
    keycloakClient = new keycloakIssuer.Client({
      client_id: keycloakConfig.clientId,
      client_secret: keycloakConfig.clientSecret,
      redirect_uris: ['http://localhost:3000/auth/callback'],
      response_types: ['code']
    });
    console.log('Keycloak OIDC inicializado correctamente');
  } catch (err) {
    console.error('Error al inicializar Keycloak:', err);
    throw err;
  }
}

initKeycloak().catch((err) => {
  console.error('No se pudo inicializar Keycloak, el servidor seguirá ejecutándose sin autenticación:', err);
});

// Resto del código sin cambios
app.use(express.json());

async function tokenRequired(req, res, next) {
  if (!keycloakClient) {
    return res.status(503).json({ error: 'Servicio de autenticación no disponible' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const userinfo = await keycloakClient.userinfo(token);
    req.userinfo = userinfo;
    next();
  } catch (err) {
    console.error('Error al validar token:', err);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

app.post('/login', async (req, res) => {
  if (!keycloakClient) {
    return res.status(503).json({ error: 'Servicio de autenticación no disponible' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  try {
    const tokenSet = await keycloakClient.grant({
      grant_type: 'password',
      username,
      password,
      scope: 'openid profile email'
    });

    res.status(200).json({
      access_token: tokenSet.access_token,
      refresh_token: tokenSet.refresh_token,
      expires_in: tokenSet.expires_in,
      token_type: tokenSet.token_type
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(401).json({ error: 'Credenciales inválidas o Keycloak no disponible', detalle: err.message });
  }
});

app.get('/estudiantes', tokenRequired, async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      "SELECT * FROM ESTUDIANTES",
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al listar estudiantes:', err);
    res.status(500).json({ error: 'Error al listar estudiantes' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

app.get('/estudiantes/:id', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      "SELECT * FROM ESTUDIANTES WHERE ID = :id",
      [req.params.id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Estudiante no encontrado' });
    } else {
      res.status(200).json(result.rows[0]);
    }
  } catch (err) {
    console.error('Error al buscar estudiante:', err);
    res.status(500).json({ error: 'Error al buscar estudiante' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

app.post('/estudiantes', async (req, res) => {
  const { nombre, apellido, edad, programa, semestre } = req.body;

  if (!nombre || !apellido || !edad || !programa || !semestre) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `INSERT INTO ESTUDIANTES (NOMBRE, APELLIDO, EDAD, PROGRAMA, SEMESTRE)
       VALUES (:nombre, :apellido, :edad, :programa, :semestre)`,
      { nombre, apellido, edad, programa, semestre },
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Estudiante creado exitosamente' });
  } catch (err) {
    console.error('Error al crear estudiante:', err);
    res.status(500).json({ error: 'Error al crear estudiante' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

app.put('/estudiantes/:id', async (req, res) => {
  const { id } = req.params;
  const { codigo, nombre, carreraID } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);
    let updateQuery = 'UPDATE ESTUDIANTES SET ';
    const binds = { id };
    const updates = [];

    if (codigo) {
      updates.push('CODIGO = :codigo');
      binds.codigo = codigo;
    }
    if (nombre) {
      updates.push('NOMBRE = :nombre');
      binds.nombre = nombre;
    }
    if (carreraID) {
      updates.push('CARRERA_ID = :carreraID');
      binds.carreraID = carreraID;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
    }

    updateQuery += updates.join(', ') + ' WHERE ID = :id';
    const result = await connection.execute(updateQuery, binds, { autoCommit: true });

    if (result.rowsAffected === 0) {
      res.status(404).json({ message: 'Estudiante no encontrado' });
    } else {
      res.status(200).json({ message: 'Estudiante actualizado exitosamente' });
    }
  } catch (err) {
    console.error('Error al actualizar estudiante:', err);
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

app.delete('/estudiantes/:id', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      "DELETE FROM ESTUDIANTES WHERE ID = :id",
      [req.params.id],
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      res.status(404).json({ message: 'Estudiante no encontrado' });
    } else {
      res.status(200).json({ message: 'Estudiante eliminado exitosamente' });
    }
  } catch (err) {
    console.error('Error al eliminar estudiante:', err);
    res.status(500).json({ error: 'Error al eliminar estudiante' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});