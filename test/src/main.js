/*
デフォルトのコードをすべて削除し、以下のコードを記述
*/

import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// 【追加】ツールをインポート
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'stats.js';
import GUI from 'lil-gui';

// 1. シーンの作成
const scene = new THREE.Scene();

// AxesHelper(線の長さ)
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
// GridHelper(全体のサイズ, マス目の数)
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);
// -----------------

// 2. カメラの作成
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.x = 0;
camera.position.y = 3;
camera.position.z = 7;
camera.position.set(0,3,10)

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);



// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshNormalMaterial();
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);


// 4. ライトの追加（これがないとBlenderのモデルは真っ暗になります）
// DirectionalLight(色, 光の強さ)
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1); // 斜め上から照らす
scene.add(light);

const gui = new GUI();
const ambientlight = new THREE.AmbientLight(0xffffff, 0);
scene.add(ambientlight);

const guiAmbient = gui.addFolder('環境光');
guiAmbient.addColor(ambientlight, 'color').name('色');
guiAmbient.add(ambientlight, 'intensity', 0, 5).name('強度');

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.31);
directionalLight.position.set(5, 5, 1); // 光の来る方向（斜め上）
scene.add(directionalLight);

// どこから光が来ているかを見えるようにする「ヘルパー（目印）」
const directionalLightHelper = new THREE.DirectionalLightHelper(
  directionalLight,
);
scene.add(directionalLightHelper);

// GUIパネルに登録
const guiDirectional = gui.addFolder('平行光 (Directional)');
guiDirectional.addColor(directionalLight, 'color').name('色');
guiDirectional.add(directionalLight, 'intensity', 0, 5).name('強度');
guiDirectional.add(directionalLight.position, 'x',0,10).name('X座標');
guiDirectional.add(directionalLight.position, 'y',0,10).name('Y座標');
guiDirectional.add(directionalLight.position, 'z', 0, 10).name('Z座標');

// ----------------------------------
// ③ 半球光（HemisphereLight）
// 空と地面の色で照らす（空の色, 地面の色, 強度）
// ----------------------------------
const hemisphereLight = new THREE.HemisphereLight(0x00ffff, 0xffff00, 0); // 水色と黄色
scene.add(hemisphereLight);

// 半球光のヘルパー
const hemisphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight);
scene.add(hemisphereLightHelper);

// ----------------------------------
// ④ 点光源（PointLight）
// 電球のように周囲を照らす（色, 強度, 届く距離）
// ----------------------------------
const pointLight = new THREE.PointLight(0xffaa00, 10, 10); // オレンジ色の光
pointLight.position.set(0, 2.5, -2.6); // モデルの少し上に配置
scene.add(pointLight);

// 点光源のヘルパー
const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.2);
scene.add(pointLightHelper);

// GUIパネルに登録
const guiPoint = gui.addFolder('点光源 (Point)');
guiPoint.add(pointLight, 'intensity', 0, 10).name('強度');
guiPoint.add(pointLight.position, 'x', -5, 5).name('位置 X');
guiPoint.add(pointLight.position, 'y', -5, 5).name('位置 Y');
guiPoint.add(pointLight.position, 'z', -5, 5).name('位置 Z');

// GUIパネルに登録
const guiHemisphere = gui.addFolder('半球光 (Hemisphere)');
guiHemisphere.addColor(hemisphereLight, 'color').name('空の色');
guiHemisphere.addColor(hemisphereLight, 'groundColor').name('地面の色');
guiHemisphere.add(hemisphereLight, 'intensity', 0, 5).name('強度');




// 5. 3Dモデル（.glb）の読み込みとGUI設定
const loader = new GLTFLoader();

loader.load('./table.glb', (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  // --- ここから追加：モデル用のGUI ---
  const guiModel = gui.addFolder('モデルの調整');

  // 位置（Position）の調整
  guiModel.add(model.position, 'x', -5, 5, 0.1).name('位置 X');
  guiModel.add(model.position, 'y', -5, 5, 0.1).name('位置 Y');
  guiModel.add(model.position, 'z', -5, 5, 0.1).name('位置 Z');

  // 回転（Rotation）の調整（※three.jsの回転は「ラジアン」という単位を使います）
  guiModel.add(model.rotation, 'x', -Math.PI, Math.PI, 0.1).name('回転 X');
  guiModel.add(model.rotation, 'y', -Math.PI, Math.PI, 0.1).name('回転 Y');
  guiModel.add(model.rotation, 'z', -Math.PI, Math.PI, 0.1).name('回転 Z');

// 【変更】サイズ（Scale）の一括調整
  // 1. 一括変更用の数値を保持する「仲介役のオブジェクト」を作る
  const scaleParams = {
    uniformScale: 1, // 初期値
  };

  // 2. GUIに登録し、onChangeでモデルのscaleすべてに値をセットする
  guiModel
    .add(scaleParams, 'uniformScale', 0.1, 5, 0.1)
    .name('サイズ（一括）')
    .onChange((value) => {
      // スライダーの値(value)が変わるたびに、モデルのX, Y, Zすべてにその値を適用する
      model.scale.set(value, value, value);
    });
  // ---------------------------------
});


const update = () => {
  window.requestAnimationFrame(update);


  renderer.render(scene, camera);
}
let i = 0;
update();

const onWindowResize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect=window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onWindowResize);