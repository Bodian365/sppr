let sensitivityState = {};

function showTab(tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll("nav button")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  document.getElementById("nav-" + tabId).classList.add("active");

  if (tabId === "data") loadData();
  if (tabId === "logic") loadCriteriaForRules();
  if (tabId === "results") {
    sensitivityState = {}; // Скидаємо чутливість при новому вході
    loadSensitivitySliders();
    loadResults();
  }
}

async function addAlternative() {
  const name = document.getElementById("alt-name").value;
  if (!name) return alert("Введіть назву");
  await fetch("/alternatives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  document.getElementById("alt-name").value = "";
  loadData();
}

async function deleteAlternative(id) {
  if (!confirm("Видалити?")) return;
  await fetch(`/alternatives/${id}`, { method: "DELETE" });
  loadData();
}

async function addCriterion() {
  const name = document.getElementById("crit-name").value;
  const type = document.getElementById("crit-type").value;
  if (!name) return alert("Заповніть назву");
  await fetch("/criteria", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, type, weight: 0 }),
  });
  document.getElementById("crit-name").value = "";
  loadData();
}

async function deleteCriterion(id) {
  if (!confirm("Видалити?")) return;
  await fetch(`/criteria/${id}`, { method: "DELETE" });
  loadData();
}

async function saveEvaluation(altId, critId, value) {
  await fetch("/evaluations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      alternative_id: altId,
      criterion_id: critId,
      value: parseFloat(value),
    }),
  });
}

async function loadData() {
  const alts = await (await fetch("/alternatives")).json();
  const crits = await (await fetch("/criteria")).json();
  const evals = await (await fetch("/evaluations")).json();

  const evalMap = {};
  evals.forEach((e) => {
    if (!evalMap[e.alternative_id]) evalMap[e.alternative_id] = {};
    evalMap[e.alternative_id][e.criterion_id] = e.value;
  });

  let html = "<h3>Матриця оцінювання</h3><table><tr><th>Альт / Критерій</th>";
  crits.forEach(
    (c) =>
      (html += `<th>${c.name} (${c.type})<br><small>Вага: ${(c.weight * 100).toFixed(1)}%</small> <button onclick="deleteCriterion(${c.id})">❌</button></th>`),
  );
  html += "<th>Дії</th></tr>";

  alts.forEach((a) => {
    html += `<tr><td><strong>${a.name}</strong></td>`;
    crits.forEach((c) => {
      const val = evalMap[a.id]?.[c.id] || "";
      html += `<td><input type="number" value="${val}" onchange="saveEvaluation(${a.id}, ${c.id}, this.value)"></td>`;
    });
    html += `<td><button onclick="deleteAlternative(${a.id})">Видалити</button></td></tr>`;
  });
  document.getElementById("data-tables").innerHTML = html + "</table>";
}

async function importData() {
  const mode = document.getElementById("import-mode").value;
  const method = document.getElementById("import-method").value;
  const url = document.getElementById("import-url").value;
  const fileInput = document.getElementById("import-file");

  const formData = new FormData();
  formData.append("mode", mode);
  formData.append("method", method);
  if (url) formData.append("url", url);
  if (fileInput.files[0]) formData.append("expert_file", fileInput.files[0]);

  const response = await fetch("/import", { method: "POST", body: formData });
  const result = await response.json();
  alert(result.message || result.error);
}

async function addRule() {
  const data = {
    criterion_id: document.getElementById("rule-crit-id").value,
    condition_type: document.getElementById("rule-condition").value,
    threshold: parseFloat(document.getElementById("rule-threshold").value),
    action_type: document.getElementById("rule-action").value,
    action_value: parseFloat(document.getElementById("rule-val").value || 0),
  };
  await fetch("/rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  alert("Правило збережено");
}

async function loadCriteriaForRules() {
  const crits = await (await fetch("/criteria")).json();
  document.getElementById("rule-crit-id").innerHTML = crits
    .map((c) => `<option value="${c.id}">${c.name}</option>`)
    .join("");
}

// --- Аналіз чутливості та результати ---
async function loadSensitivitySliders() {
  const crits = await (await fetch("/criteria")).json();
  let html = "";
  crits.forEach((c) => {
    html += `<div class="slider-group">
      <label style="width:30%">${c.name}</label>
      <input type="range" min="0" max="1" step="0.05" value="${c.weight}" oninput="updateSensitivity(${c.id}, this.value)">
      <span style="width:10%" id="sens-val-${c.id}">${(c.weight * 100).toFixed(0)}%</span>
    </div>`;
  });
  document.getElementById("sensitivity-sliders").innerHTML = html;
}

async function updateSensitivity(critId, val) {
  document.getElementById(`sens-val-${critId}`).innerText =
    `${(val * 100).toFixed(0)}%`;
  sensitivityState[critId] = val;
  loadResults();
}

async function loadResults() {
  const method = document.getElementById("method-select").value;
  let url = `/analyze?method=${method}`;
  if (Object.keys(sensitivityState).length > 0) {
    url += `&sensitivity=${encodeURIComponent(JSON.stringify(sensitivityState))}`;
  }

  const res = await (await fetch(url)).json();
  if (res.error) {
    document.getElementById("best-alt").innerText = "Помилка розрахунку";
    document.getElementById("explanation").innerText = res.error;
    return;
  }

  document.getElementById("best-alt").innerText =
    "🏆 Найкращий вибір: " + res.best_alternative;
  document.getElementById("explanation").innerText = res.explanation;

  const ctx = document.getElementById("resultsChart").getContext("2d");
  if (window.myChart) window.myChart.destroy();
  window.myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: res.ranking.map((r) => r.name),
      datasets: [
        {
          label: "Рейтинговий бал",
          data: res.ranking.map((r) => r.score),
          backgroundColor: "rgba(52, 152, 219, 0.7)",
        },
      ],
    },
    options: { scales: { y: { beginAtZero: true } } },
  });
}

window.onload = loadData;
