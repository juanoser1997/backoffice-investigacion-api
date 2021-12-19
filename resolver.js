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



const key = "CLAVEDIFICIL";

const resolvers = {
  Query: {
    usuarios: () => listUsuarios,
    usuarios: async (parent, args, context, info) => {
      return await User.find();
    },
    usuario: async (parent, args, context, info) => {
      return await User.findOne({ _id: args._id });
    },
    usuarioCorreo: async (parent, args, context, info) => {
      return await User.findOne({ correo: args.correo });
    },
    proyectos: async (parent, args, context, info) => {
      return proyectos();
    },
    getProject: async (parent, args, context, info) => getProject(args.nombre),
    findLiderProjects: async (parent, args, context, info) => {
      return await Project.find({ lider: args.lider });
    },
    getProjectId: async (parent, args, context, info) => {
      const project = await Project.findOne({ _id: args._id });
      return project;
    },
    getProjectInscri: async (parent, args, context, info) => {
      try {
        const project = await Project.find({
          $and: [
            { "inscripciones.id_estudiante": args.id_estudiante },
            { "inscripciones.estado": "Aceptada" },
          ],
        });
        return project;
      } catch (error) {
        console.log(error);
      }
    },
    ProyectosAprobados: async (parent, args, context, info) => {
      try {
        return await Project.find({ aprobacion: "Aprobado" });
      } catch (error) {
        console.log(error);
      }
    },
    ProyectosPendientes: async (parent, args, context, info) => {
      try {
        return await Project.find({ aprobacion: "Pendiente" });
      } catch (error) {
        console.log(error);
      }
    },
    MisProyectosEstudiante: async (parent, args, context, info) => {
      try {
        return await Project.find({
          $and: [
            { "incripciones.id_estudiante": args.id_estudiante },
            { estado_proyecto: "Activo" },
            { "inscripciones.estado": "Aceptada" },
            { "inscripciones.fecha_egreso": { $eq: undefined } },
          ],
        });
      } catch (error) {
        console.log(error);
      }
    usuariosEstudiantes: async () =>
      await User.find({ tipo_usuario: "Estudiante" }),
    liderProject: async (parent, args, context, info) =>
      Project.find({ lider: args.lider }),
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
        { estado: "Autorizado" }
      )
        .then((u) => "Usuario activo")
        .catch((err) => "Fallo la activacion");
    },
    inactivateUser: (parent, args, context, info) => {
      return User.updateOne(
        { identificacion: args.ide },
        { estado: "No autorizado" }
      )
        .then((u) => "Usuario No autorizado")
        .catch((err) => "Fallo la autorización");
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
            const usuario = await User.findOne({ correo: args.usuario })
            if (!usuario) {
                return {
                    status: 401
                }
            }
            //AES256 es una libreria de criptografia para encriptar y desencriptar.
            const claveDesencriptada = aes256.decrypt(key, usuario.clave)
            if (args.clave != claveDesencriptada) {
                return {
                    status: 401
                }
            }
            const token = jwt.sign({
                rolesito: usuario.tipo_usuario
            }, key, { expiresIn: 60 * 60 * 2 })

            return {
                status: 200,
                jwt: token
            }

        } catch (error) {
            console.log(error)
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
          {
            arrayFilters: [
              { "ins.id_inscripcion": { $eq: args.id_inscripcion } },
            ],
          }
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
            $set: { inscripciones: args.ins },
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
      }
    },
    updateInscripcionProyecto: async (parent, args, context, info) => {
      try {
        const user = await User.findOne({
          identificacion: parseInt(args.id_estudiante),
        });
        if (user && user.estado === "Autorizado") {
          const project = await Project.findOne({ nombre: args.nombre });
          if (project && project.estado_proyecto === "Activo") {
            if (
              project.inscripciones.find(
                (i) => parseInt(i.id_estudiante) == user.identificacion
              )
            ) {
              let result = ""
              project.inscripciones.map(async (ins) => {
                if (ins.id_estudiante == String(user.identificacion)) {

                  if (ins.fecha_egreso == undefined) {
                    console.log(ins.id_estudiante)
                    result = "El usuario ya pertenece al proyecto indicado";
                  } else {
                    result = "Se ha inscrito nuevamente al proyecto";
                    await Project.updateOne(
                      { nombre: project.nombre },
                      { $set: { "inscripciones.$[ins].estado": "Pendiente" } },
                      {
                        arrayFilters: [
                          { "ins.id_inscripcion": { $eq: ins.id_inscripcion } },
                        ],
                      }
                    );
                    await Project.updateOne(
                      { nombre: project.nombre },
                      { $unset: { "inscripciones.$[ins].fecha_egreso": "" } },
                      {
                        arrayFilters: [
                          { "ins.id_inscripcion": { $eq: ins.id_inscripcion } },
                        ],
                      }
                    );

                  }
                }

              });
              return result
            } else {
              const project = await Project.findOne({ nombre: args.nombre });
              await Project.updateOne(
                { nombre: project.nombre },
                {
                  $push: {
                    inscripciones: {
                      id_inscripcion: args.id_inscripcion,
                      id_estudiante: args.id_estudiante,
                      estado: "Pendiente",
                    },
                  },
                }
              );
              return "Inscripcion creada ";
            }
          } else {
            return "Proyecto no valido para adicionar mas integrantes";
          }
        } else {
          return "usuario no valido";
        }

        //     const project = await Project.findOne({nombre : args.nombre })
        //  await  Project.updateOne({"nombre": project.nombre},{$push: {"inscripciones": {"id_inscripcion":args.id_inscripcion, "id_estudiante":args.id_estudiante, "estado":"Pendiente"}}})

        //     return "Inscripcion creada "
      } catch (error) {
        console.log(error);
      }
    },
    updateDescripcionAvance: async (parent, args, context, info) => {
      try {
        const project = await Project.findOne({ nombre: args.nombre });
        await Project.updateOne(
          { nombre: project.nombre },
          { $set: { "avances.$[avc].descripcion": args.descripcion } },
          { arrayFilters: [{ "avc.id_avance": { $eq: args.id_avance } }] }
        );

        return "descripcion avance actualizada ";
        // }
      } catch (error) {
        console.log(error);
      }
    },
    updateNuevoAvance: async (parent, args, context, info) => {
      try {
        const project = await Project.findOne({ nombre: args.nombre });
        let fecha = new Date();
        await Project.updateOne(
          { nombre: project.nombre },
          {
            $push: {
              avances: {
                id_avance: args.id_avance,
                fecha_avance: fecha,
                descripcion: args.descripcion,
              },
            },
          }
        );
        if (project.avances.length == 0)
          await Project.updateOne(
            { nombre: project.nombre },
            { $set: { fase: "En Desarrollo" } }
          );
        return "Avance creado ";
      } catch (error) {
        console.log(error);
      }
    },
    InactivarProyecto: async (parent, args, context, info) => {
      try {
        const project = await Project.findOne({ _id: args._id });
        await Project.updateOne(
          { _id: project._id },
          { $set: { estado_proyecto: "Inactivo" } }
        );
        project.inscripciones.map(async (inscripcion) => {
          console.log(inscripcion.fecha_egreso);
          if (
            inscripcion.fecha_egreso == undefined &&
            inscripcion.estado == "Aceptada"
          ) { await Project.updateOne({ nombre: project.nombre },{ $set: { "inscripciones.$[ins].fecha_egreso": new Date() } },{arrayFilters: [{ "ins.id_inscripcion": { $eq: inscripcion.id_inscripcion } },],});
          }
        });

        return "Proyecto Inactivo ";
      } catch (error) {
        console.log(error);
      }
    },
    ActivarProyecto: async (parent, args, context, info) => {
      try {
        const project = await Project.findOne({ _id: args._id });
        if (project.fase != "Terminado") {
          await Project.updateOne(
            { _id: project._id },
            { $set: { estado_proyecto: "Activo" } }
          );
          return "Proyecto Activado ";
        } else {
          return "Proyecto Terminado";
        }
      } catch (error) {
        console.log(error);
      }
    },
    CambiarAprobacionProyecto: async (parent, args, context, info) => {
      try {
        if (args.aprobacion == "Aprobado") {
          await Project.updateOne(
            { _id: args._id },
            {
              $set: {
                estado_proyecto: "Activo",
                aprobacion: "Aprobado",
                fase: "Inciado",
                fecha_inicio: new Date(),
              },
            }
          );
          return "Proyecto Aprobado y Activado ";
        } else {
          await Project.updateOne(
            { _id: args._id },
            { $set: { aprobacion: args.aprobacion } }
          );

          return "Proyecto No Aprobado ";
        }
      } catch (error) {
        console.log(error);
      }
    },
    CambiarFaseProyecto: async (parent, args, context, info) => {
      try {
        if (args.fase == "Terminado") {
          await Project.updateOne(
            { _id: args._id },
            {
              $set: {
                estado_proyecto: "Inactivo",
                fase: "Terminado",
                fecha_terminacion: new Date(),
              },
            }
          );
          return "Proyecto Finalizado ";
        } else {
          await Project.updateOne(
            { _id: args._id },
            { $set: { fase: args.fase } }
          );

          return "Fase Actualizada ";
        }
      } catch (error) {
        console.log(error);
      }
    },
  },
};
module.exports = resolvers;
