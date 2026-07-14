const asyncHandler=(requesthandler)=>{
   return (req,res,next)=>{
    Promise
    .resolve(requesthandler(req,res,next))
    //if promised resolve then ok when not resolved it saying "throw" this word simply said the promise is rejected 
    //this word "throw" only work on promise to say the promise that the promise is rejected and then catch part will recoeved the
    //error object created by Apierror object creator
    //error=error object conatin all details whihc is a truthy value
    .catch((error)=>next(error))
    //next() is just simple next execution but 
    //next(truthy value/any value) give instruction to stop further execution to express
   }
}

export {asyncHandler}