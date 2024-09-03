const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://aswathy:YxxUgQXU1S61UKSu@cluster0.tisb8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB', err);
  });

module.exports = mongoose;
