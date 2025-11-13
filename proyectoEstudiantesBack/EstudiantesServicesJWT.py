from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from EstudianteGestion import EstudianteEjemplo
from flasgger import Swagger

app = Flask(__name__)
CORS(app)

# Configuración JWT
app.config['JWT_SECRET_KEY'] = 'uptc2025'

# Configuración Swagger
app.config['SWAGGER'] = {
    "title": "API Estudiantes UPTC",
    "uiversion": 3
}
swagger = Swagger(app)

jwt = JWTManager(app)

# Simulación de base de datos en memoria
estudiantes = []


# ------------------ RUTAS ------------------

@app.route('/')
def home():
    """
    Home de la API
    ---
    responses:
      200:
        description: Mensaje de bienvenida
    """
    return jsonify({"mensaje": "API Flask con AWS Lambda funcionando 🚀"})


@app.route('/login', methods=['POST'])
def login():
    """
    Login de usuario
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
              example: jorge
            password:
              type: string
              example: uptc
    responses:
      200:
        description: Login exitoso con JWT
      401:
        description: Credenciales incorrectas
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username == "jorge" and password == "uptc":
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"mensaje": "Credenciales incorrectas"}), 401


@app.route('/listaEstudiantes', methods=['GET'])
@jwt_required()
def lista_estudiantes():
    """
    Lista todos los estudiantes
    ---
    security:
      - BearerAuth: []
    responses:
      200:
        description: Lista de estudiantes
    """
    if not estudiantes:  # Solo agrega un ejemplo si la lista está vacía
        estudiante = EstudianteEjemplo("1", "Jorge", "31")
        estudiantes.append(estudiante.to_json())
    return jsonify(estudiantes)


@app.route('/crearEstudiante', methods=['POST'])
@jwt_required()
def crear_estudiante():
    """
    Crear un nuevo estudiante
    ---
    security:
      - BearerAuth: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            codigo:
              type: string
              example: "2"
            nombre:
              type: string
              example: "Juan"
            promedio:
              type: string
              example: "4.5"
    responses:
      201:
        description: Estudiante creado
      400:
        description: Código ya existente
    """
    data = request.get_json()
    codigo = data.get('codigo')
    nombre = data.get('nombre')
    promedio = data.get('promedio')

    # Validación: verificar que no exista ya el código
    if any(e['codigo'] == codigo for e in estudiantes):
        return jsonify({"mensaje": "El código ya existe"}), 400

    estudiante = EstudianteEjemplo(codigo, nombre, promedio)
    estudiantes.append(estudiante.to_json())

    return jsonify({"mensaje": "Estudiante creado exitosamente"}), 201


@app.route('/obtenerEstudiante/<codigo>', methods=['GET'])
@jwt_required()
def obtener_estudiante(codigo):
    """
    Obtener estudiante por código
    ---
    security:
      - BearerAuth: []
    parameters:
      - name: codigo
        in: path
        type: string
        required: true
        example: "1"
    responses:
      200:
        description: Estudiante encontrado
      404:
        description: Estudiante no encontrado
    """
    estudiante = next((e for e in estudiantes if e['codigo'] == codigo), None)

    if estudiante:
        return jsonify(estudiante), 200
    else:
        return jsonify({"mensaje": "Estudiante no encontrado"}), 404


@app.route('/actualizarEstudiante/<codigo>', methods=['PUT'])
@jwt_required()
def actualizar_estudiante(codigo):
    """
    Actualizar un estudiante
    ---
    security:
      - BearerAuth: []
    parameters:
      - name: codigo
        in: path
        type: string
        required: true
        example: "1"
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            nombre:
              type: string
              example: "Carlos"
            promedio:
              type: string
              example: "3.8"
    responses:
      200:
        description: Estudiante actualizado
      404:
        description: Estudiante no encontrado
    """
    data = request.get_json()
    estudiante = next((e for e in estudiantes if e['codigo'] == codigo), None)

    if estudiante:
        estudiante['nombre'] = data.get('nombre', estudiante['nombre'])
        estudiante['promedio'] = data.get('promedio', estudiante['promedio'])
        return jsonify({"mensaje": "Estudiante actualizado exitosamente"}), 200
    else:
        return jsonify({"mensaje": "Estudiante no encontrado"}), 404


@app.route('/eliminarEstudiante/<codigo>', methods=['DELETE'])
@jwt_required()
def eliminar_estudiante(codigo):
    """
    Eliminar un estudiante
    ---
    security:
      - BearerAuth: []
    parameters:
      - name: codigo
        in: path
        type: string
        required: true
        example: "1"
    responses:
      200:
        description: Estudiante eliminado
      404:
        description: Estudiante no encontrado
    """
    global estudiantes
    if any(e['codigo'] == codigo for e in estudiantes):
        estudiantes = [e for e in estudiantes if e['codigo'] != codigo]
        return jsonify({"mensaje": "Estudiante eliminado exitosamente"}), 200
    else:
        return jsonify({"mensaje": "Estudiante no encontrado"}), 404


# Configuración de seguridad para Swagger
swagger.template = {
    "securityDefinitions": {
        "BearerAuth": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Agrega 'Bearer <tu_token>'"
        }
    }
}

# 👇 OJO: NO pongas app.run(), Lambda lo manejará con Zappa.
