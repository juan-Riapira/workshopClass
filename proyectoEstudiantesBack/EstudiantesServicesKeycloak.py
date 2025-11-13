from flask import Flask, request, jsonify
from flask_cors import CORS
from keycloak import KeycloakOpenID
from EstudianteGestion import EstudianteEjemplo
from functools import wraps

app = Flask(__name__)
app.secret_key = "uptc"
CORS(app)

estudiantes = []


keycloak_openid = KeycloakOpenID(
    server_url="http://localhost:8081/",
    client_id="12",
    realm_name="Arquitectura",
    client_secret_key="gGDpc1Xa1RzD4uKuz3aDa8WvShVJOETZ"
)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header:
            return jsonify({"error": "Token requerido"}), 401

        try:
            token = auth_header.split(" ")[1]
            userinfo = keycloak_openid.userinfo(token)
        except Exception:
            return jsonify({"error": "Token inválido o expirado"}), 401

        return f(userinfo, *args, **kwargs)
    return decorated

@app.route('/login', methods=['POST'])
def login():
    
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Faltan credenciales"}), 400
    
    try:
        token = keycloak_openid.token(username, password)
        return jsonify({
            "access_token": token['access_token'],
            "refresh_token": token['refresh_token'],
            "expires_in": token['expires_in'],
            "token_type": token['token_type']
        }), 200
    except Exception as e:
        return jsonify({"error": "Credenciales inválidas o Keycloak no disponible", "detalle": str(e)}), 401

@app.route('/listaEstudiantes', methods=['GET'])
@token_required
def lista_estudiantes(userinfo):
    estudiante = EstudianteEjemplo("1","Jorge","30")
    estudiante1 = EstudianteEjemplo("2","Ana","23")
    estudiante2 = EstudianteEjemplo("3","Luis","28")
    estudiante3 = EstudianteEjemplo("4","Gabriel","25")
    estudiante4 = EstudianteEjemplo("5","Luciana","24")
    estudiantes.append(estudiante.to_json())
    estudiantes.append(estudiante1.to_json())
    estudiantes.append(estudiante2.to_json())
    estudiantes.append(estudiante3.to_json())
    estudiantes.append(estudiante4.to_json())
    return jsonify(estudiantes)


if __name__ == '__main__':
    app.run(debug=True)