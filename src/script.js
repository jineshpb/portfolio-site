import './style.css?'
import * as dat from 'lil-gui'
import { Pane } from 'tweakpane'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js'
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js'
import { gsap } from 'gsap'




/**
 * Base
 */
// Debug
// const gui = new dat.GUI({
//     width: 400
// })

//Button interaction


// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
// scene.background =  new THREE.Color( 0Xcbbed0 )
scene.background =  new THREE.Color( 0Xf6ebf1 )
scene.fog = new THREE.Fog(0Xf6ebf1, 17, 27);

/**
 * Debug panel
 */



const pane = new Pane()
pane.containerElem_.style.width = '320px'
const deskLight = pane.addFolder({
    title: 'intensity'
});
// deskLight.addInputs(Intensity, 'intensity');


// const pane = new Pane({
//     container: document.getElementById('someContainer'),
//   });
    




/**
 * Overlay
 */

const overlayGeometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    uniforms:
    {
        uAlpha: { value: 1 }
    },
    vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader:`
        uniform float uAlpha;
        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

// const steamMaterial = new THREE.ShaderMaterial({
//     wireframe: true,
//     vertexShader:`
//         varying vec2 vUv;

//         void main()
//         {
//             vec4 modelPosition = modelMatrix * vec4(position, 1.0);
//             vec4 viewPosition = viewMatrix * modelPosition;
//             vec4 projectionPosition = projectionMatrix * viewPosition;
//             gl_Position = projectionPosition;

//             vUv = uv;
//         }
//     `,
//     fragmentShader: `

//         varying vec2 vUv;

//         #pragma glslify: perlin2d = require('../shaders/partials/perlin2d.glsl')

//         void main()
//         {
//             float perlin = perlin2d();
//             gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
//         }
//     `
// })

//animation vatriable
let mixer, roomModel
var telescopeObject

var target = new THREE.Vector3()
var mouseX = 0, mouseY = 0
var windowHalfX = window.innerWidth / 2
var windowHalfY = window.innerHeight / 2


/**
 * Loaders
 */

const loadingBarElement = document.querySelector('.loading-bar')

const loadingManager = new THREE.LoadingManager(
    //Loaded
    ()=>
    {
        gsap.delayedCall(0.5, () =>
        {
            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value:0 })
            loadingBarElement.classList.add('ended')
            loadingBarElement.style.transform = ``

        })
        
    },

    //Progress
    (itemUrl, itemsLoaded, itemsTotal)=>
    {
        const progressRatio = itemsLoaded / itemsTotal
        loadingBarElement.style.transform = `scaleX(${progressRatio})`
    }
)

// Texture loader
const textureLoader = new THREE.TextureLoader(loadingManager)

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */
const bakedRoomWallsTexture = textureLoader.load('Room_structure.jpg')
bakedRoomWallsTexture.flipY = false
bakedRoomWallsTexture.encoding = THREE.sRGBEncoding

const bakedRoomStructureTexture = textureLoader.load('Objects_in_the scene.jpg')
bakedRoomStructureTexture.flipY = false
bakedRoomStructureTexture.encoding = THREE.sRGBEncoding

// const bakedRoomObjectsTexture = textureLoader.load('object_in_the_scene_bake.jpg')
// bakedRoomObjectsTexture.flipY = false
// bakedRoomObjectsTexture.encoding = THREE.sRGBEncoding

// const bakedFootballTexture = textureLoader.load('football-bake.jpg')
// bakedFootballTexture.flipY = false
// bakedFootballTexture.encoding = THREE.sRGBEncoding

// const bakedSquareTexture = textureLoader.load('square-frame-bake.jpg')
// bakedSquareTexture.flipY = false
// bakedSquareTexture.encoding = THREE.sRGBEncoding

const bakedTelescopeTexture = textureLoader.load('scope-bake.jpg')
bakedTelescopeTexture.flipY = false
bakedTelescopeTexture.encoding = THREE.sRGBEncoding

// const bakedPlantTexture = textureLoader.load('plant.jpg')
// bakedPlantTexture.flipY = false
// bakedPlantTexture.encoding = THREE.sRGBEncoding


/**
 * Materials
 */
//Baked material
const bakedMaterialRoomStructure = new THREE.MeshBasicMaterial({ map: bakedRoomStructureTexture })
const bakedMaterialRoomWalls = new THREE.MeshBasicMaterial({ map: bakedRoomWallsTexture })
const materialText = new THREE.MeshBasicMaterial({ color: 0xFFFDD0 })
const bakedMaterialTelescope = new THREE.MeshBasicMaterial({ map: bakedTelescopeTexture })




// const bakedMaterialRoomObjects = new THREE.MeshBasicMaterial({ map: bakedRoomObjectsTexture })

// const bakedMaterialFootball = new THREE.MeshBasicMaterial({ map: bakedFootballTexture })
// const bakedMaterialSquare = new THREE.MeshBasicMaterial({ map: bakedSquareTexture })
// const bakedMaterialPlant = new THREE.MeshBasicMaterial({ map: bakedPlantTexture })


/**
 * Scene room
 */

gltfLoader.load(
    'workspace_attempt_3_011.glb',
    (gltf) =>
    {
        // gltf.scene.traverse((child) =>
        // {
        // })

        roomModel = gltf.scene
        
        
        const roomWallMesh = gltf.scene.children.find(child => child.name === 'room-contents')
        const roomStructureMesh = gltf.scene.children.find(child => child.name === 'room-structure')
        const chairMesh = gltf.scene.children.find(child => child.name === 'Chair_top')
        const roomObjectsTextMesh = gltf.scene.children.find(child => child.name === 'wall_text')
        const plantMesh = gltf.scene.children.find(child => child.name === 'Plant_tall')
        const steamMesh = gltf.scene.children.find(child => child.name === 'Coffee_steam')
        telescopeObject = gltf.scene.children.find(child => child.name === 'telescope-scope')

       

        // const roomStructureMesh = gltf.scene.children.find(child => child.name === 'room-structure')
        // const roomObjectsMesh = gltf.scene.children.find(child => child.name === 'objects-in-the-scene')
        // const roomObjectsFootballMesh = gltf.scene.children.find(child => child.name === 'football')
        // const roomObjectsSquareMesh = gltf.scene.children.find(child => child.name === 'cube-frame')

        console.log(steamMesh)

        
 

        // roomObjectsMesh.material = bakedMaterialRoomObjects
        roomWallMesh.material = bakedMaterialRoomStructure
        chairMesh.material = bakedMaterialRoomStructure
        plantMesh.material = bakedMaterialRoomStructure
        roomStructureMesh.material = bakedMaterialRoomWalls
        roomObjectsTextMesh.material = materialText
        // roomObjectsFootballMesh.material = bakedMaterialFootball
        // roomObjectsSquareMesh.material = bakedMaterialSquare
        telescopeObject.material = bakedMaterialTelescope

        // steamMesh.material = steamMaterial

        // roomModel.getObjectByName("plant_3").material = bakedMaterialPlant
        // roomModel.getObjectByName("plant_2").material = bakedMaterialPlant
        // roomModel.getObjectByName("plant_1").material = bakedMaterialPlant

        scene.add(gltf.scene)

        mixer = new THREE.AnimationMixer(roomModel)
        const clips = gltf.animations

        clips.forEach(function(clip) {
            const action = mixer.clipAction(clip)
            action.play()
        })


    }
)




// 

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}


    window.addEventListener('resize', () =>
    {

        if(window.innerWidth != sizes.width || window.innerHeight != sizes.height){


           
            // Update sizes
            sizes.width = window.innerWidth
            sizes.height = window.innerHeight
            

            // Update camera
            camera.aspect = sizes.width / sizes.height
            camera.updateProjectionMatrix()

            // Update renderer
            renderer.setSize(sizes.width, sizes.height)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            
        }

      



    
    })




/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 200
camera.position.y = 100
camera.position.z = -200
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = .03

controls.target.set(0, 3, -2)

controls.minDistance = 13
controls.maxDistance = 16

controls.minPolarAngle = 0
controls.maxPolarAngle = Math.PI /2

controls.minAzimuthAngle =  Math.PI / 2
controls.maxAzimuthAngle = - Math.PI 

controls.enablePan = false

controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: ''
}




/**
 * Points of interest
 */

const raycaster = new THREE.Raycaster()

const points =[
    {
        position: new THREE.Vector3(1.55, 0.3, -0.6),
        element: document.querySelector('.point-0')
    }
]




console.log(points);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

/**
 * Post processing
 */

const effectComposer = new EffectComposer(renderer)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height)

const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

// const saoPass = new SAOPass()
// effectComposer.addPass(saoPass)

// const dotScreenPass = new DotScreenPass()
// effectComposer.addPass(dotScreenPass)



/**
 * Track attemp 2
 */

document.addEventListener('mousemove', (e)=>{
    var mousecoords = getMousePos(e)
    

    if(telescopeObject){
        moveJoint(mousecoords, telescopeObject, 30) 
    }

    

})

function getMousePos(e){
    return { x: e.clientX, y: e.clientY }
}

function moveJoint(mouse, joint, degreeLimit){
    let degrees = getMouseDegrees(mouse.x, mouse.y, degreeLimit)

    
    joint.rotation.y = THREE.Math.degToRad(degrees.x) 
    joint.rotation.x = THREE.Math.degToRad(- degrees.y) 
}



/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    // const elapsedTime = clock.getElapsedTime()
    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
    var deltaTime = clock.getDelta()

     //objects animation
    if( mixer) mixer.update( deltaTime )
    
    // Update controls
    controls.update()

    //GO thorugh each point
    for(const point of points)
    {
        const screenPosition = point.position.clone()
        screenPosition.project(camera)

        raycaster.setFromCamera(screenPosition, camera)
        
        // if(scene.children) 
        // {
        //     const intersects = raycaster.intersectObject(scene.children)
        // }
        // 

        // if(intersects.length === 0)
        // {
        //     point.element.classList.add('visible')
        // }

        const translateX = screenPosition.x * sizes.width * 0.5
        const translateY = -screenPosition.y * sizes.height * 0.5
        point.element.style.transform = `translate(${translateX}px, ${translateY}px)`
    }

    // Render
    // renderer.render(scene, camera)
    effectComposer.render()

}

tick()

//mouse tracker function

function getMouseDegrees(x, y, degreeLimit) {
    let dx = 0,
        dy = 0,
        xdiff,
        xPercentage,
        ydiff,
        yPercentage;
  
    let w = { x: window.innerWidth, y: window.innerHeight };
  
    // Left (Rotates neck left between 0 and -degreeLimit)
    
     // 1. If cursor is in the left half of screen
    if (x <= w.x / 2) {
      // 2. Get the difference between middle of screen and cursor position
      xdiff = w.x / 2 - x;  
      // 3. Find the percentage of that difference (percentage toward edge of screen)
      xPercentage = (xdiff / (w.x / 2)) * 100;
      // 4. Convert that to a percentage of the maximum rotation we allow for the neck
      dx = ((degreeLimit * xPercentage) / 100) * -1; }
  // Right (Rotates neck right between 0 and degreeLimit)
    if (x >= w.x / 2) {
      xdiff = x - w.x / 2;
      xPercentage = (xdiff / (w.x / 2)) * 100;
      dx = (degreeLimit * xPercentage) / 100;
    }
    // Up (Rotates neck up between 0 and -degreeLimit)
    if (y <= w.y / 2) {
      ydiff = w.y / 2 - y;
      yPercentage = (ydiff / (w.y / 2)) * 100;
      // Note that I cut degreeLimit in half when she looks up
      dy = (((degreeLimit * 0.5) * yPercentage) / 100) * -1;
      }
    
    // Down (Rotates neck down between 0 and degreeLimit)
    if (y >= w.y / 2) {
      ydiff = y - w.y / 2;
      yPercentage = (ydiff / (w.y / 2)) * 100;
      dy = (degreeLimit * yPercentage) / 100;
    }
    return { x: dx, y: dy };
  }