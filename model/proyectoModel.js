const { Schema, model } = require('mongoose')


const project = new Schema({
    identificador: {
        type: String,
        required: true,
        unique: true
    },
    nombre: {
        type: String,
        required: true,
        unique: true
    },
    objetivos_generales: String,
    objetivos_especificos: [String],
    presupuesto: Number,
    facultad:String,
    inscripciones:[
         { 
         id_ins : String,
         id_estudiante:String,
         estado:String,
         fecha_ingreso:Date,
         fecha_egreso:Date,
        }
        ],
    fecha_inicio: {
        type: Date,
        default: new Date()
    },
    fecha_terminacion: Date,
    avances: [
        {
        id_avance : String,
        fecha_avance : Date,
        descripcion : String,
        observaciones_lider : String, 
        }
    ],
    estado_proyecto: {
        type: String,
        default: "inactivo"
    },
    fase: String,
    lider: String,
    integrantes: [{
        type: Schema.Types.ObjectId,
        ref: "usuarios"
    }]
},
    {
        timestamps: true
    }
)
module.exports = model('proyectos', project)