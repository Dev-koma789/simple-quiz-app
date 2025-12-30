"use strict";

/**
 * ====================================
 * 4択クイズアプリ：メインロジック
 * ====================================
 */

/* ===== DOM取得（HTML要素をJavaScriptで操作できるように捕まえる） ===== */
const questionEl = document.querySelector(".quiz-question"); // 問題文を表示する場所
const choiceButtons = document.querySelectorAll(".choice"); // 4つの選択肢ボタン
const quizProgress = document.querySelector(".quiz-progress"); // 「全10問」などの進捗表示
const quizNumber = document.querySelector(".quiz-number"); // 「第1問」などの番号表示
const timeEl = document.getElementById("time"); // 残り時間の数字
const timeCircle = document.querySelector(".time-circle"); // タイマーの外枠（円）

const correctEl = document.querySelector(".judge.correct"); // 「〇」の画像・文字
const wrongEl = document.querySelector(".judge.wrong"); // 「×」の画像・文字

const categoryScreen = document.getElementById("category-screen"); // カテゴリ選択画面
const quizScreen = document.getElementById("quiz-screen"); // クイズ本編画面
const resultScreen = document.getElementById("result-screen"); // 結果発表画面
const quizTitle = document.querySelector(".quiz-title"); // クイズのタイトル（日本史など）

/* ===== 状態変数（アプリが今どういう状況かを覚えておく変数） ===== */
let currentQuestionIndex = 0; // 今何問目か（0からスタート）
let score = 0; // 正解数

// タイマー設定
const timeLimit = 10; // 制限時間（10秒）
let remainingTime = 0; // 残り時間
let timerId = null; // タイマーを止めるためのID

// フラグ（スイッチ）
let isAnswering = true; // 今、回答を受け付けているかどうか（連打防止用）

// 問題データ
let filteredQuizData = []; // 選ばれたカテゴリの問題10問を入れる配列

// カテゴリIDを日本語名に変換する辞書
const CATEGORY_LABELS = {
  history: "日本史クイズ",
  science: "理科クイズ",
  geography: "地理クイズ",
  trivia: "雑学クイズ",
  manga: "漫画クイズ",
  anime: "アニメクイズ",
};

/* ===== 表示・UI制御（画面の見た目を変える関数） ===== */

// 画面を切り替える（指定した画面以外は display: none で隠す）
function showScreen(screenName) {
  categoryScreen.style.display = "none";
  quizScreen.style.display = "none";
  resultScreen.style.display = "none";

  if (screenName === "category") categoryScreen.style.display = "block";
  if (screenName === "quiz") quizScreen.style.display = "block";
  if (screenName === "result") resultScreen.style.display = "block";
}

// 選択肢ボタンを押せるようにしたり、押せなくしたりする
function setChoicesDisabled(disabled) {
  choiceButtons.forEach((btn) => {
    btn.disabled = disabled;
  });
}

// 残り時間の表示を最新にする
function updateTimerDisplay() {
  timeEl.textContent = remainingTime;
}

// 「全10問」という文字を更新する
function updateProgress() {
  quizProgress.textContent = `全${filteredQuizData.length}問`;
}

// 「第〇問」という数字を更新する
function updateQuestionNumber() {
  quizNumber.textContent = `第${currentQuestionIndex + 1}問`;
}

/* ===== メイン処理：問題を表示する ===== */
function showQuestion() {
  // もし最後の問題を解き終わっていたら、結果画面へ
  if (currentQuestionIndex >= filteredQuizData.length) {
    showResult();
    return;
  }

  isAnswering = true; // 回答受付開始
  setChoicesDisabled(false); // ボタンを押せるようにする

  // 今の問題データを取得
  const quiz = filteredQuizData[currentQuestionIndex];

  // 画面のテキストを書き換える
  questionEl.textContent = quiz.question;
  updateQuestionNumber();

  // 4つのボタンに選択肢のテキストを入れる
  choiceButtons.forEach((btn, index) => {
    btn.textContent = `${quiz.choices[index]}`;
  });
}

/* ===== タイマー処理 ===== */
function startTimer() {
  clearInterval(timerId); // 前のタイマーが動いていたら止める

  remainingTime = timeLimit; // 時間をリセット
  updateTimerDisplay();

  // 1秒ごとに実行
  timerId = setInterval(() => {
    remainingTime--;
    updateTimerDisplay();

    // 0秒になったら
    if (remainingTime <= 0) {
      clearInterval(timerId);
      timerId = null;
      // 時間切れは「不正解」として処理
      finishQuestion(false, null);
    }
  }, 1000);
}

/* ===== 判定エフェクト（〇か×を出す） ===== */
function showJudge(isCorrect) {
  correctEl.style.display = "none";
  wrongEl.style.display = "none";

  if (isCorrect) {
    correctEl.style.display = "block"; // 〇を表示
  } else {
    wrongEl.style.display = "block"; // ×を表示
  }

  // 1秒経ったら消す
  setTimeout(() => {
    correctEl.style.display = "none";
    wrongEl.style.display = "none";
  }, 1000);
}

/* ===== 回答後の処理（正解・不正解・時間切れ共通） ===== */
function finishQuestion(isCorrect, clickedIndex) {
  if (!isAnswering) return; // すでに回答済みなら何もしない

  isAnswering = false; // 回答受付終了（連打禁止）
  setChoicesDisabled(true); // ボタンを押せなくする

  clearInterval(timerId); // タイマーを止める
  timerId = null;

  const quiz = filteredQuizData[currentQuestionIndex];

  // 【演出】正解のボタンを緑色にする
  choiceButtons[quiz.answer].classList.add("correct-answer");

  // 【演出】もし間違えたなら、自分が押したボタンを赤色にする
  if (!isCorrect && clickedIndex !== null) {
    choiceButtons[clickedIndex].classList.add("wrong-answer");
  }

  if (isCorrect) {
    score++; // 正解ならスコア加算
  }

  showJudge(isCorrect); // 〇か×を画面に出す

  // 1秒待ってから次の問題へ
  setTimeout(() => {
    // ボタンの色付けクラスを外してリセット
    choiceButtons.forEach((btn) => {
      btn.classList.remove("correct-answer", "wrong-answer");
    });

    currentQuestionIndex++; // 次の問題番号へ
    showQuestion(); // 次の問題を表示
    if (currentQuestionIndex < filteredQuizData.length) {
      startTimer(); // 次のタイマー開始
    }
  }, 1000);
}

/* ===== イベント設定（ボタンが押された時の動作） ===== */

// 4つの選択肢ボタンそれぞれにクリックイベントをつける
choiceButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    if (!isAnswering) return;

    const quiz = filteredQuizData[currentQuestionIndex];
    const isCorrect = index === quiz.answer; // 押した番号と正解番号が一致するか

    finishQuestion(isCorrect, index);
  });
});

// カテゴリ選択ボタン
document.querySelectorAll("#category-screen button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const category = btn.dataset.category; // HTMLの data-category を取得

    // JSONファイルを読み込む
    loadCategoryData(category)
      .then((data) => {
        // 問題をランダムに並び替える
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        // 先頭から10問だけ抜き出す
        filteredQuizData = shuffled.slice(0, 10);

        // ゲーム変数をリセット
        currentQuestionIndex = 0;
        score = 0;

        // 画面のタイトルを変えてクイズ開始！
        quizTitle.textContent = CATEGORY_LABELS[category];
        updateProgress();
        showScreen("quiz");
        showQuestion();
        startTimer();
      })
      .catch((error) => {
        console.error(error);
        alert("問題データの読み込みに失敗しました");
      });
  });
});

// 「カテゴリ選択に戻る」ボタン
document.getElementById("back-button").addEventListener("click", () => {
  showScreen("category");
});

/* ===== 結果表示（セキュリティに配慮した書き方） ===== */
function showResult() {
  showScreen("result");

  const messageEl = document.getElementById("result-message");
  const scoreEl = document.getElementById("result-score");
  const total = filteredQuizData.length;

  let message = "";
  let color = "";

  // スコアによってメッセージと色を分ける
  if (score === total) {
    message = "🎉 パーフェクト！天才ですね！";
    color = "#ef4444";
  } else if (score >= total * 0.7) {
    message = "👍 すごい！あともう少し！";
    color = "#f59e0b";
  } else {
    message = "😊 お疲れ様でした！";
    color = "#3b82f6";
  }

  // textContent を使って安全に文字を表示
  messageEl.textContent = message;
  scoreEl.textContent = `${score} / ${total}`;
  scoreEl.style.color = color;
}

// 外部のJSONファイルを読み込む関数
function loadCategoryData(category) {
  return fetch(`quiz-data/${category}.json`).then((res) => {
    if (!res.ok) {
      throw new Error("JSONの読み込みに失敗しました");
    }
    return res.json();
  });
}

/* ===== アプリ起動：最初にカテゴリ画面を出す ===== */
showScreen("category");
