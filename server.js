let mongoose = require('mongoose');
let dotenv = require('dotenv');
const { Mongoose } = require('mongoose');
let app = require('./app');

dotenv.config({ path: './config.env' });

// let db = process.env.DATABASE_LOCAL;
let db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('connected to the db successfully');
  });

// console.log(process.argv   );
let port = 5000;
app.listen(port, () => {
  console.log(`app is listening the port ${port}...`);
});
