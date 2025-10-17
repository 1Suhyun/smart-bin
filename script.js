let sceneCount = 4;
let model, webcam, maxPredictions;
let scanStartTime;
let lastDetectedBin = ""; // stores the bin detected
let arrowDown = null;
let scanningShown = false; // new flag for scanning text

// Scene switching
function goToScene(sceneNumber){
    for(let i = 1; i <= sceneCount; i++){
        document.getElementById(`scene${i}`).style.display = 'none';
    }
    document.getElementById(`scene${sceneNumber}`).style.display = 'block';

    if(sceneNumber === 2){
        initScan();
    }
}

// Reset function
function resetToStart(){
    if (webcam) webcam.stop();
    lastDetectedBin = "";
    scanningShown = false; // reset flag
    goToScene(1);
    reattachStartListeners();
}

// Reattach tap listener to start scene
function reattachStartListeners(){
    const scene1 = document.getElementById("scene1");
    scene1.addEventListener("click", startScan);
    scene1.addEventListener("touchstart", startScan);
}

// Start scan
function startScan(){
    const scene1 = document.getElementById("scene1");
    scene1.removeEventListener("click", startScan);
    scene1.removeEventListener("touchstart", startScan);
    goToScene(2);
}

// Teachable Machine setup
const URL = "model/";

async function initScan(){
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    webcam = new tmImage.Webcam(200, 200, true);
    await webcam.setup();
    await webcam.play();
    document.getElementById("webcam-container").innerHTML = "";
    document.getElementById("webcam-container").appendChild(webcam.canvas);

    arrowDown = document.getElementById("arrowDown");
    scanStartTime = null;
    scanningShown = false;

    window.requestAnimationFrame(scanLoop);
}

// Scan loop
async function scanLoop(){
    webcam.update();
    const prediction = await model.predict(webcam.canvas);

    let highest = prediction[0];
    prediction.forEach(p => {
        if (p.probability > highest.probability) highest = p;
    });

    // Show scanning text only once when detected
    if (highest.probability > 0.8 && !scanningShown) {
        arrowDown.innerText = "Scanning...";
        arrowDown.classList.add("scanning");
        scanningShown = true;
    } else if (highest.probability < 0.8) {
        arrowDown.innerText = "↓";
        arrowDown.classList.remove("scanning");
        scanningShown = false; // reset if object disappears
    }

    if (!scanStartTime) scanStartTime = Date.now();
    const elapsed = Date.now() - scanStartTime;

    if (highest.probability > 0.8 && elapsed >= 3000) {
        lastDetectedBin = highest.className.toLowerCase();

        const binInstruction = document.getElementById("binInstruction");
        if (lastDetectedBin === "waste bin") {
            binInstruction.innerText = "Put in Waste Bin";
            binPhrase.innerText = "Used tissues are contaminated and go in the black bin. \nOnly unused go to the blue bin";
            instructionVideo.src = "assets/waste loop.mov";
        } else if (lastDetectedBin === "blue bin") {
            binInstruction.innerText = "Remove cup sleeves";
            binPhrase.innerText = "Used coffee cups are contaminated and go in the black bin. \nOnly the sleeve can be recycled in the blue bin.";
            instructionVideo.src = "assets/blue bin loop.mov";
        } else if (lastDetectedBin === "blue bin cardboard"){ //add new one// 
            binInstruction.innerText = "Put in Blue Bin"; //add new one
            binPhrase.innerText = "Clean cardboard box belongs in the blue bin. Just flatten it!";
            instructionVideo.src = "assets/cardboard loop.mov"; // reuse same video as blue bin

        } else {
            binInstruction.innerText = "Put in the appropriate bin";
        }

        goToScene(3);
        return;
    }

    window.requestAnimationFrame(scanLoop);
}

// Update Scene 4 text based on last detected bin
function showCompleteText() {
    const completeText = document.getElementById("completeText");

    if (lastDetectedBin === "blue bin") {
        completeText.innerText = "If thrown correctly,\nYou could earn 30 points!";
    } else if (lastDetectedBin === "waste bin") {
        completeText.innerText = "If thrown correctly,\nYou could earn 10 points!";


    } else if (lastDetectedBin === "blue bin cardboard") {
        completeText.innerText = "If thrown correctly,\nYou could earn 15 points!";


    } else {
        completeText.innerText = "If thrown correctly,\nYou could earn points!";
    }
idPromptText.innerText = "Tap your student ID on the bin to earn points!";

}

// Initialize Scene 1 tap
document.addEventListener("DOMContentLoaded", function(){
    reattachStartListeners();
});
