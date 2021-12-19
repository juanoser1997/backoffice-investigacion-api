const { gql } = require('apollo-server-express')

//Nodemon
const typeDefs = gql`
    scalar Date
    type Usuario{
        nombre_completo: String
        identificacion: Int
        estado: String
        correo: String
        tipo_usuario: String
        clave:String
        _id:String
    }
    type Proyecto{
        _id : String
        identificador: String
        objetivos_generales: String
        objetivos_especificos: [String]
        presupuesto: Int
        fecha_inicio: Date
        fecha_terminacion: Date
        lider: String
        facultad:String
        fase:String
        nombre:String
        estado_proyecto:String
        inscripciones:[inscripciones]
        avances: [avances]
        aprobacion : String
    }
    type  avances  {
        id_avance : String
        fecha_avance : Date
        descripcion : String
        observaciones_lider : String 
    }
    type inscripciones{
        id_inscripcion : String
        id_estudiante:String
        estado:String
        fecha_ingreso:Date
        fecha_egreso:Date
    }
    type Query{
        usuarios: [Usuario]
        usuario(_id: String): Usuario
        usuarioCorreo(correo: String): Usuario
        proyectos:[Proyecto]
        getProject(nombre:String):Proyecto
        getProjectId(_id:String):Proyecto
        findLiderProjects (lider:String):[Proyecto]
        getProjectInscri(id_estudiante:String):[Proyecto]
        usuariosEstudiantes : [Usuario]
        liderProject(lider:String): [Proyecto]
    }
    input UserInput{
        nombre_completo: String
        identificacion:Int
        clave: String
        tipo_usuario: String
        correo: String
    }
    input UserUpdateInput{
        nombre_completo: String
        identificacion:Int
        clave: String
        correo: String
        _id:String
    }
    input inscripcionesInput{
        id_inscripcion : String
        id_estudiante:String
        estado:String
    }
    input ProjectInput{
        objetivos_generales: String
        objetivos_especificos: String
        presupuesto: Int
        fecha_inicio: Date
        lider: String
        nombre:String
        fase: String
    }
    type Auth{
        jwt: String
        status: Int
    }

    input ProjectUpdateInput{
        objetivos_generales: String
        objetivos_especificos: [String]
        presupuesto: Int
        nombre:String
        _id:String
    }

type Mutation{
    createUser(user:UserInput):String
    createProject(project:ProjectInput):String
    activeUser(identificacion:Int):String
    inactivateUser(ide:Int):String
    deleteUser(ident:Int):String
    deleteProject(nombreProyecto:String):String
    insertUserToProject(identificacion:Int,nombreProyecto:String):String
    autenticar(usuario:String, clave:String):Auth
    updateProject(project: ProjectUpdateInput ):String
    updateEstadoIncripcion(_id:String, id_inscripcion:String, nuevo_estado:String):String
    updateObservaciones(_id:String, id_avance:String, observaciones:String ):String
    updateUser(user: UserUpdateInput): String
    updateEstadoIncripciongroup(ins: [inscripcionesInput], _id:String ):String
    updateInscripcionProyecto(nombre:String, id_inscripcion:String, id_estudiante:String):String
    updateDescripcionAvance(nombre:String, id_avance:String, descripcion:String ):String
    updateNuevoAvance(nombre:String, id_avance:String, descripcion:String):String
    
    
}
`
module.exports = typeDefs

// db.proyectos.update({"nombre": 'Agua Potable'},{$set: {"inscripciones.$[ins].estado": "Pendiente si"}},{arrayFilters:[{"ins.ins_id": {$eq: ("1")}},]})