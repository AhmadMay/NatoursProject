const { time } = require('console');
let express = require('express');
let mongoose = require('mongoose');
let fs = require('fs');
let app = express();
app.use(express.json);

let tours = JSON.parse(fs.readFileSync('./data/tours-simple.json', 'utf-8'));

let db = process.env.DATABASE_LOCAL;

let myschema = mongoose.connect(db);

let productSchema = new mongoose.Schema({
  name: String,
  age: Number,
  DOB: Number,
});

let product = async () => {
  new mongoose.model('products', myEschema);

  let data = new product({
    name: 'ahmed Sharif',
    age: 25,
    DOB: 16011997,
  });
  let saveData = await data.save()
  console.log(saveData);
};
data();


app.get('/api/product')

let port = 5200;
app.listen(port, () => {
  console.log(`app is listening to the port ${port}`);
});
