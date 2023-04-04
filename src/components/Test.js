import React, { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import './App.css';

const firebaseConfig = {
    apiKey: "AIzaSyC82BplNwlajMdIUWdeq4aYpEj1uGSYUHA",
    authDomain: "aidb-ea149.firebaseapp.com",
    projectId: "aidb-ea149",
    storageBucket: "aidb-ea149.appspot.com",
    messagingSenderId: "493339661636",
    appId: "1:493339661636:web:ef88d6ffc39583ff403311",
    measurementId: "G-TKZ4D4XH65"};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function Test() {
  const [model, setModel] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [results, setResults] = useState([]);
const [multiplePredictions, setMultiplePredictions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await db.collection("results").get();
      const fetchedResults = querySnapshot.docs.map((doc) => doc.data());
      setResults(fetchedResults);
    };

    fetchData();
  }, []);

  const loadModel = async () => {
    const loadedModel = await tf.loadLayersModel("/tfjs_model/model.json");
    setModel(loadedModel);
  };

  const predictImage = async (imageElement) => {
    if (!model) return;

    const tensor = tf.browser
      .fromPixels(imageElement)
      .resizeNearestNeighbor([150, 150])
      .toFloat()
      .expandDims();
    const predictions = model.predict(tensor).dataSync();
    const predictionLabel = predictions[0] > 0.5 ? "Pneumonia" : "Normal";
    setPrediction(predictionLabel);
    return predictionLabel;
  };

  const handleResult = async (event) => {
    const isCorrect = event.target.value === "true";
    const newResult = { prediction, isCorrect };

    await db.collection("results").add(newResult);

    setResults((prevResults) => [...prevResults, newResult]);
    setPrediction(null);
  };

  useEffect(() => {
    loadModel();
  }, []);

  const handleImageUpload = async (event) => {
    const zipFile = event.target.files[0];
  
    const jszip = new JSZip();
    const zipData = await jszip.loadAsync(zipFile);
    const imageFiles = Object.values(zipData.files).filter((file) => !file.dir);
  
    const newPredictions = [...multiplePredictions];
  
    for (const imageFile of imageFiles) {
      const imageBlob = await imageFile.async("blob");
      const reader = new FileReader();
  
      await new Promise((resolve, reject) => {
        reader.onload = async (event) => {
          const imageElement = new Image();
          imageElement.src = event.target.result;
  
          imageElement.onload = async () => {
            const currentPrediction = await predictImage(imageElement);
            newPredictions.push({
              fileName: imageFile.name,
              prediction: currentPrediction,
            });
            resolve();
          };
        };
        reader.readAsDataURL(imageBlob);
      });
    }
  
    setMultiplePredictions(newPredictions);
  };
  const incorrectCount = results.filter((result) => !result.isCorrect).length;
  const totalCount = results.length;
  const percentage =
    totalCount > 0
      ? ((incorrectCount / totalCount) * 100).toFixed(2)
      : 0;
  const statsText = `Total : ${totalCount} | Erreurs : ${incorrectCount} (${percentage}%)`;

  return (
    <div className="App">
        <div className="container">
          <div className="left">
            <h2>Statistiques</h2>
            <div className="stats">
            <div className="App">
        <div className="container">
          <div className="left">
            <h2>Statistiques</h2>
            <div className="stats">
              <p>{statsText}</p>
              <ul>
                {results.map((result, index) => (
                  <li
                    key={index}
                    className={result.isCorrect ? "correct" : "incorrect"}
                  >
                    {result.prediction} -{" "}
                    {result.isCorrect ? "Correct" : "Incorrect"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="right">
            <input type="file" onChange={handleImageUpload} />
            {prediction && (
              <div className="accuracy">Prédiction : {prediction}</div>
            )}
            {prediction && (
              <div className="buttons">
                <button className="true" value="true" onClick={handleResult}>
                  Vrai
                </button>
                <button
                  className="false"
                  value="false"
                  onClick={handleResult}
                >
                  Faux
                </button>
              </div>
            )}
            <div className="predictions-list">
  <h3>Liste des prédictions</h3>
  <ul>
    {multiplePredictions.map((pred, index) => (
      <li key={index}>
         {pred.prediction}
      </li>
    ))}
  </ul>
</div>
          </div>
        </div>
      </div>
      </div>
      </div>
      </div>
      </div>

    );
}

export default Test;
             


