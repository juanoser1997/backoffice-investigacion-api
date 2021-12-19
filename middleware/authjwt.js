const jwt = require('jsonwebtoken')
const key = 'CLAVEDIFICIL';

const validarToken = (request, response, next) => {
    const token = request.headers['authorization']
    if (!token) {
        return response.status(401).json({ response: "Token invalido" })
    }
    try {
        const tipo_usuario = jwt.verify(token, key)
        if (tipo_usuario) {
            request.tipo_usuario = tipo_usuario.rolesito
            next();
            return
        }
        return response.status(401).json({ response: "Token invalido" })
    } catch (error) {
        return response.status(401).json({ response: "Token invalido" })
    }
}
const admin = (request, response, next) => {
    if (request.tipo_usuario != "Administrador") {
        return response.status(403).json({ response: "Permisos insuficientes" })
    }
    next();
}
const isLider = (rol) => {
    return rol === "Líder"
}
const isAdmin = (rol) => {
    return rol === "Administrador"
}

const estudiante = (request, response, next) => {
    if (request.tipo_usuario != "Estudiante") {
        return response.status(403).json({ response: "Permisos insuficientes" })
    }
    next();
}
module.exports = {
    validarToken,
    admin,
    estudiante,
    isAdmin,
    isLider
}