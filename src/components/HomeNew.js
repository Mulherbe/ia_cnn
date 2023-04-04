import React, { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import '../App.css';
import {  Link } from "react-router-dom";

const firebaseConfig = {
  apiKey: "AIzaSyC82BplNwlajMdIUWdeq4aYpEj1uGSYUHA",
  authDomain: "aidb-ea149.firebaseapp.com",
  projectId: "aidb-ea149",
  storageBucket: "aidb-ea149.appspot.com",
  messagingSenderId: "493339661636",
  appId: "1:493339661636:web:ef88d6ffc39583ff403311",
  measurementId: "G-TKZ4D4XH65"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function HomeNew() {

  const [model, setModel] = useState(null);
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [results, setResults] = useState([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  useEffect(() => {
    const unsubscribe = db
      .collection("resultsV2")
      .orderBy("id", "desc")
      .onSnapshot((snapshot) => {
        const resultsList = snapshot.docs.map((doc) => doc.data());
        setResults(resultsList);
      });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadModel = async () => {
    const loadedModel = await tf.loadLayersModel("/tfjs_model_V2/model.json");
    setModel(loadedModel);
  };

  const predictImage = async (imageElement) => {
    if (!model) return;

    const tensor = tf.browser
      .fromPixels(imageElement)
      .resizeNearestNeighbor([150, 150])
      .toFloat()
      .expandDims();
    const predictions = await model.predict(tensor).data();
    console.log(predictions)
    const maxPredictionIndex = predictions.indexOf(Math.max(...predictions));
    const predictionLabel = ['Normal', 'Other', 'Pneumonia'][maxPredictionIndex];
    setPrediction(predictionLabel);
  };

  const handleImageUpload = (event) => {
    const imageFile = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const imageElement = new Image();
      imageElement.src = event.target.result;
      setImage(imageElement);
      imageElement.onload = async () => {
        await predictImage(imageElement);
        setImagePreviewUrl(reader.result);

      };
    };
    reader.readAsDataURL(imageFile);
  };
  const handleResult = async (event) => {
    const isCorrect = event.target.value === "true";
    const batch = db.batch();
    const counterRef = db.collection("countersV2").doc("resultsCounterV2");
    batch.update(counterRef, { count: firebase.firestore.FieldValue.increment(1) });
    const counterSnapshot = await counterRef.get();
    const newCount = counterSnapshot.data().count + 1;
    const newResult = { id: newCount, prediction, isCorrect };
    const newResultRef = db.collection("resultsV2").doc(newCount.toString());
    batch.set(newResultRef, newResult);
    await batch.commit();
    setPrediction(null);
    setImagePreviewUrl(null);

  };

  useEffect(() => {
    loadModel();
  }, []);

  const incorrectCount = results.filter((result) => !result.isCorrect).length;
  const totalCount = results.length;
  const percentage = totalCount > 0 ? ((incorrectCount / totalCount) * 100).toFixed(2) : 0;
  const statsText = `Total : ${totalCount} | Erreurs : ${incorrectCount} (${percentage}%)`;

  return (
    <div className="wrapper">
      <Link class="label-file" to={`Home`}>Version 1</Link>
      <div className="App">

        <div className="container">
          <div className="left">
            <h2>Statistiques</h2>
            <div className="stats">
              <p>{statsText}</p>
              <ul>
                {results.map((result, index) => (
                  <li key={index} className={result.isCorrect ? 'correct' : 'incorrect'}>
                    {result.prediction} - {result.isCorrect ? 'Correct' : 'Incorrect'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="right">
          <label for="file" class="label-file">Choisir une image</label>
            <input id="file" class="input-file" type="file" onChange={handleImageUpload} ></input>
            {prediction && <div className="accuracy">Prédiction : {prediction}</div>}
            {prediction && (
              <div className="buttons">
                <button className="true" value="true" onClick={handleResult}>
                  Vrai
                </button>
                <button className="false" value="false" onClick={handleResult}>
                  Faux
                </button>
              </div>
            )}
            {imagePreviewUrl && (
              <div >
                <img src={imagePreviewUrl} alt=" preview" className="image-preview" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

  );
}
export default HomeNew;