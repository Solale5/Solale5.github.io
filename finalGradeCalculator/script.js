document.querySelector(".check").addEventListener("click", function () {
  const myGrade1 = Number(document.querySelector(".myGrade").value);
  const myDesiredGrade = Number(document.querySelector(".desiredGrade").value);
  const percentOfMyTotalGrade =
    Number(document.querySelector(".percentOfTotalGrade").value) / 100;
  document.querySelector(".message").textContent = `you need a: ${finalGrade(
    myGrade1,
    myDesiredGrade,
    percentOfMyTotalGrade
  )} % to get a ${myDesiredGrade}`;
});

function finalGrade(currentGrade, desired, weight) {
  let f;
  let restofClass = 1 - weight;

  f = (desired - restofClass * currentGrade) / weight;
  return f;
}
