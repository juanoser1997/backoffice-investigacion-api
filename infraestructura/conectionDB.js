const mongoose = require('mongoose')

const urlDB ='mongodb+srv://juan:admin@minticapp.f0y6b.mongodb.net/MinticProyecto?retryWrites=true&w=majority'
mongoose.connect(urlDB);
const mongoDB = mongoose.connection;
mongoDB.on('open', _ =>{
    console.log("conectado a la bd")
})