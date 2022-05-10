const body = document.querySelector("body"),
     container = document.querySelector(".container"),
     toggle = document.querySelector(".user-close")
     

     toggle.addEventListener("click", ()=>{
         container.classList.toggle("close")
         console.log('clicked');
     })
     
    //  window.addEventListener("beforeunload", (event)=>{
    //     container.classList.add("close")
    //     console.log('reloaded');
    //  }) 
         
   
  