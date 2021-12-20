const Project = require('../model/proyectoModel')
const User = require('../model/usuarioModel')
const { v4: uuidv4 } = require('uuid');
var mongoose = require('mongoose');



const addUserProject = async (identificacion, nombreProyecto) => {
    const user = await User.findOne({ identificacion })
    if (user && user.estado === "Activo") {
        const project = await Project.findOne({ nombre: nombreProyecto })
        if (project && project.estado_proyecto=="Activo") {
            if (project.integrantes.find(i => i == user.identificacion)) {
                return "El usuario ya pertenece al proyecto indicado"
            } else {
                await Project.updateOne({ nombre: nombreProyecto }, { $push: { integrantes: user._id } })
                return "Usuario adicionado correctamente"
            }
        } else {
            return "Proyecto no valido para adicionar un integrante, consulte al administrador"
        }
    } else {
        return "Usuario no valido"
    }
}

const createProject = async (project) => {
    const nuevoProyecto = new Project(project);
    const projects =  await  Project.find()

//    _id = new mongoose.Types.ObjectId()
//      nuevoProyecto._id =projects.map((proyecto)=> {
//          while(proyecto._id == _id){
//             _id = new mongoose.Types.ObjectId()
//          }
//         return  _id
//      })
    nuevoProyecto.identificador = uuidv4()

    return nuevoProyecto.save()
        .then(u => "Proyecto creado")
        .catch(err => console.log(err));
}

const deleteProject = (nombreProyecto) => {
    return Project.updateOne({ nombre: nombreProyecto }, { activo: false })
        .then(u => "Proyecto 'eliminado'")
        .catch(err => "Fallo la eliminacion");
}

const proyectos = async () => await Project.find({}).populate("integrantes")

const getProject = async (nombre) => await Project.findOne({ nombre })


module.exports = {
    addUserProject,
    getProject,
    proyectos,
    deleteProject,
    createProject
}