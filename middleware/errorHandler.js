function errorHandler(error,req,res,next){
  console.error(error);

  if(error.code===11000){
    return res.status(409).json({
      message:'A product with this SKU already exists',
      field:error.keyValue?Object.keys(error.keyValue)[0]:'sku'
    });
  }

  if(error.name==='ValidationError'){
    return res.status(400).json({
      message:'Product validation failed',
      errors:Object.values(error.errors).map(item=>item.message)
    });
  }

  if(error.name==='CastError'){
    return res.status(400).json({message:'Invalid value supplied'});
  }

  if(error.type==='entity.parse.failed'){
    return res.status(400).json({message:'Request body contains invalid JSON'});
  }

  res.status(error.status||500).json({
    message:error.status?error.message:'Internal server error'
  });
}

module.exports=errorHandler;
