const EventEmitter=require("events");
const emitter=new EventEmitter();

emitter.on("go", function(results){
    if(results==="lost"){
        console.log("come here")
    }
    
})
emitter.on("go", function(){
    console.log("How are you")
})
emitter.on("you", function(){
    console.log("onu princeley")
})
process.on("exit", function(code){
    console.log("completely existed", code);
});

emitter.emit("go", "lost");