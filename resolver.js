const {
    addUserProject,
    getProject,
    proyectos,
    deleteProject,
    createProject,
  } = require("./service/proyecto.service");
  const { buscarUsuarioPorIdentificacion } = require("./service/usuario.service");
  const Project = require("./model/proyectoModel");
  const User = require("./model/usuarioModel");
  let aes256 = require("aes256");
  const { isLider } = require("./middleware/authjwt");
  const jwt = require("jsonwebtoken");
  
  /*const listUsuarios = [
    {
      nombre: "Ramon Castano",
      identificacion: 123456789,
      estado: "activo",
      clave: "claveFacil",
      email: "ramon@gmail.com",
      tipo_usuario: "estudiante",
    },
    {
      nombre: "Ernesto",
      identificacion: 98765,
      estado: "inactivo",
      clave: "ClaveDificil",
      email: "ernesto@gmail.com",
      tipo_usuario: "estudiante",
    },
    {
      nombre: "Daniel Saavedra",
      identificacion: 123456789,
      estado: "activo",
      email: "daniel@gmail.com",
      tipo_usuario: "lider",
    },
  ];*/
  const key = "CLAVEDIFICIL";
  
  const resolvers = {
    Query: {
      usuarios: () => listUsuarios,
      usuarios: async (parent, args, context, info) => {
        return await User.find()
      },
      usuario: async (parent, args, context, info) =>
       {return await User.findOne ({_id:args._id})},
      proyectos: async (parent, args, context, info) => {
        return proyectos();
      },
      getProject: async (parent, args, context, info) => getProject(args.nombre),
      findLiderProjects: async (parent, args, context, info) => {
        return await Project.find({ lider: args.lider });
      },
     getProjectId: async (parent, args, context, info) => {
       const project = await Project.findOne({ _id: args._id });
        return project
      },
      getProjectInscri: async (parent, args, context, info) => {
        try {
        
         const project = await Project.find({$and: [{"inscripciones.id_estudiante": args.id_estudiante } , {'inscripciones.estado':'Aceptada'}]})
         return project
        
        } catch (error) {
          console.log(error);
        }
      },
      usuariosEstudiantes: async () => await User.find({tipo_usuario:'Estudiante'}),
      liderProject: async (parent, args, context, info)=> Project.find({lider:args.lider})
    },
    Mutation: {
      createUser: (parent, args, context, info) => {
        const { clave } = args.user;
        const nuevoUsuario = new User(args.user);
        const encryptedPlainText = aes256.encrypt(key, clave);
        nuevoUsuario.clave = encryptedPlainText;
        return nuevoUsuario
          .save()
          .then((u) => "usuario creado")
          .catch((err) => console.log(err));
      },
      activeUser: (parent, args, context, info) => {
        return User.updateOne(
          { identificacion: args.identificacion },
          { estado: "Activo" }
        )
          .then((u) => "Usuario activo")
          .catch((err) => "Fallo la activacion");
      },
      inactivateUser: (parent, args, context, info) => {
        return User.updateOne({ identificacion: args.ide }, { estado: "No autorizado" })
            .then(u => "Usuario No autorizado")
            .catch(err => "Fallo la autorización");
      },
      deleteUser: (parent, args, context, info) => {
        if (isLider(context.rol)) {
          return User.deleteOne({ identificacion: args.ident })
            .then((u) => "Usuario eliminado")
            .catch((err) => "Fallo la eliminacion");
        }
      },
      deleteProject: (parent, args, context, info) => {
        if (isLider(context.rol)) {
          deleteProject(args.nombreProyecto);
        }
        //code smells... Recuerdan?
      },
      insertUserToProject: async (parent, args, context, info) =>
        addUserProject(args.identificacion, args.nombreProyecto),
      createUser: (parent, args, context, info) => {
        const { clave } = args.user;
        const nuevoUsuario = new User(args.user);
        const encryptedPlainText = aes256.encrypt(key, clave);
        nuevoUsuario.clave = encryptedPlainText;
        return nuevoUsuario
          .save()
          .then((u) => "usuario creado")
          .catch((err) => console.log(err));
      },
      createProject: (parent, args, context, info) => {
        if (isLider(context.rol)) {
          createProject(args.project);
        }
      },
      autenticar: async (parent, args, context, info) => {
        try {
          const usuario = await User.findOne({ email: args.usuario });
          if (!usuario) {
            return "Verique usuario y clave";
          }
  
          const claveDesencriptada = aes256.decrypt(key, usuario.clave);
          if (args.clave != claveDesencriptada) {
            return "Verique usuario y clave";
          }
          const token = jwt.sign(
            {
              rolesito: usuario.tipo_usuario,
            },
            key,
            { expiresIn: 60 * 60 * 2 }
          );
  
          return token;
        } catch (error) {
          console.log(error);
        }
      },
      updateProject: async (parent, args, context, info) => {
        try {
          const project = await Project.findOne({ _id: args.project._id });
          if (project.estado_proyecto == "Activo") {
            await Project.updateOne(
              { _id: project.id },
              {
                $set: {
                  objetivos_generales: args.project.objetivos_generales,
                  objetivos_especificos: args.project.objetivos_especificos,
                  presupuesto: args.project.presupuesto,
                  nombre: args.project.nombre,
                },
              }
            );
            return "proyecto Actualizado ";
          } else {
            return "Proyecto no Activo ";
          }
        } catch (error) {
          console.log(error);
        }
      },
      updateUser: async (parent, args, context, info) => {
        try {
        
            await User.updateOne(
              { _id: args.user._id },
              {
                  $set: {
                      nombre_completo: args.user.nombre_completo,
                     identificacion: args.user.identificacion,
                      clave: args.user.clave,
                      correo: args.user.correo,
                    },
              }
            );
            return "usuario Actualizado ";
        
        } catch (error) {
          console.log(error);
        }
      },
      updateEstadoInscripcion: async (parent, args, context, info) => {
        try {
          const project = await Project.findOne({ _id: args._id });
          await Project.updateOne(
            { nombre: project.nombre },
            { $set: { "inscripciones.$[ins].estado": args.nuevo_estado } },
            { arrayFilters: [{ "ins.id_inscripcion": { $eq: args.id_inscripcion } }] }
          );
          //     if (project.estado_proyecto == "Activo"){
          //     await Project.updateOne({ _id : project.id }, {  $set: {objetivos_generales: args.project.objetivos_generales,objetivos_especificos: args.project.objetivos_especificos,  presupuesto: args.project.presupuesto,nombre:args.project.nombre} })
          //     return "proyecto Actualizado "
          // }
          // else {
          return "inscricion actualizada ";
          // }
        } catch (error) {
          console.log(error);
        }
      },
      updateObservaciones: async (parent, args, context, info) => {
        try {
          const project = await Project.findOne({ _id: args._id });
          await Project.updateOne(
            { nombre: project.nombre },
            {
              $set: { "avances.$[avc].observaciones_lider": args.observaciones },
            },
            { arrayFilters: [{ "avc.id_avance": { $eq: args.id_avance } }] }
          );
          //     if (project.estado_proyecto == "Activo"){
          //     await Project.updateOne({ _id : project.id }, {  $set: {objetivos_generales: args.project.objetivos_generales,objetivos_especificos: args.project.objetivos_especificos,  presupuesto: args.project.presupuesto,nombre:args.project.nombre} })
          //     return "proyecto Actualizado "
          // }
          // else {
          return "avance actualizada ";
          // }
        } catch (error) {
          console.log(error);
        }
      },
      updateEstadoIncripciongroup: async (parent, args, context, info) => {
        try {
          const project = await Project.findOne({ _id: args._id });
          await Project.updateOne(
            { _id: project._id },
            {
              $set: { "inscripciones": args.ins },
            }
          );
          //     if (project.estado_proyecto == "Activo"){
          //     await Project.updateOne({ _id : project.id }, {  $set: {objetivos_generales: args.project.objetivos_generales,objetivos_especificos: args.project.objetivos_especificos,  presupuesto: args.project.presupuesto,nombre:args.project.nombre} })
          //     return "proyecto Actualizado "
          // }
          // else {
          return "Inscipcion actualizada ";
          // }
        } catch (error) {
          console.log(error);

          
          insertUsertoProject: async (parent, args, context, info) =>{
            const user = await User.findOne({identificacion:args.identificacion})
            if (user && user.estado === "Autorizado"){
              const project = await Project.findOne({nombre:args.nombreProyecto})
              if (project && project.activo) {
                if (project.inscripciones.find (i=> i == user.identificacion)){
                  return "El usuario ya pertenece al proyecto indicado"

                }else {
                  await project.updateOne({nombre:args.nombreProyecto}, { $push: {inscripciones:user.identificacion}})
                  return "usuario adicionado correctamente"
                }
                }else{
                  return "Proyecto no valido para adicionar mas integrantes"
                }
              }else{
                return "usuario no valido"
              }
            }
        

        }
      },
    },
  };
  module.exports = resolvers;
