require('dotenv').config();
const express=require('express');
const connectDB=require('./config/db');
const productRoutes=require('./routes/productRoutes');
const errorHandler=require('./middleware/errorHandler');
const app=express();
app.use(express.json());
app.get('/',(req,res)=>{
  res.json({message:'Inventory Management API is running'});
});
app.use('/api/products',productRoutes);
app.use(errorHandler);
const PORT=process.env.PORT || 5000;
connectDB()
  .then(()=>{
    app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
  })
  .catch(error=>{
    console.error('Database connection failed:',error.message);
    process.exit(1);
  });
