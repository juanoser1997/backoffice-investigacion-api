const { Schema, model } = require('mongoose')

const usuario = new Schema({
    nombre_completo: {
        type: String,
        required: true
    },
    identificacion: {
        type: Number,
        unique: true,
        required: true
    },
    tipo_usuario: {
        type: String,
        required: true
    },
    estado: {
        type: String,
        default: "Inactivo"
    },
    correo:{
        type: String,
        unique:true
    },
    clave: {
        type: String,
        required: true
    }
})
module.exports = model('usuarios', usuario,"usuarios")