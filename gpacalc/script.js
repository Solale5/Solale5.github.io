"use strict";
//https://stackoverflow.com/questions/17001961/how-to-add-drop-down-list-select-programmatically very useful

const arr = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"];
const arr2 = [4, 3.7, 3.3, 3.0, 2.7, 2.3, 2.0, 1.7, 1.3, 1.0, 0.0];
const myParent = document.querySelector(".rows");
let numberOfAdds = 0;
let GPA;
//create new grade row input on click
const addBtn = document.querySelector(".add");
addBtn.addEventListener("click", function () {
  numberOfAdds++;
  const div = document.createElement("div");
  myParent.appendChild(div);
  const gradeRow = document.createElement("select");
  const weight = document.createElement("input");
  weight.placeholder = "credits";
  weight.className = "credits";
  gradeRow.className = "custom-select";
  div.appendChild(gradeRow);
  div.appendChild(weight);
  //Create and append the options
  for (var i = 0; i < arr.length; i++) {
    const option = document.createElement("option");
    option.value = arr2[i];
    option.text = arr[i];
    gradeRow.appendChild(option);
  }
});

//remove new grade row input on click
const rmBtn = document.querySelector(".remove");
rmBtn.addEventListener("click", function () {
  const div = document.querySelectorAll("div");

  const lastDiv = div[div.length - 1];
  if (numberOfAdds > 0) {
    lastDiv.remove();
    numberOfAdds--;
  }
});

//calculate gpa function

const calcBtn = document.querySelector(".calculate");
calcBtn.addEventListener("click", function () {
  // select all grades and credits into node lists
  const grades = document.querySelectorAll(".custom-select");
  const weights = document.querySelectorAll("input");

  const gradeWeights = [];
  const credits = [];
  grades.forEach((element) => gradeWeights.push(element.value));
  weights.forEach((element) => credits.push(parseFloat(element.value)));

  console.log(gradeWeights);
  console.log(credits);
  GPA = gpa(gradeWeights, credits);
  const message = document.querySelector(".message");
  message.textContent = `Your GPA is a: ${GPA}`;
  console.log(GPA);
});

function gpa(grades, credits) {
  let gpa = 0.0;
  let totalGPs = 0.0;
  let totalCreds = 0.0;

  for (let index = 0; index < grades.length; index++) {
    totalCreds += credits[index];
  }

  for (let j = 0; j < grades.length; j++) {
    totalGPs += grades[j] * credits[j];
  }

  gpa = totalGPs / totalCreds;
  return gpa;
}
