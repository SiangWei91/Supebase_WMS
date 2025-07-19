import { supabase } from "./supabase-client.js";

const coldroomFilter = document.getElementById("coldroom-filter");
const dateFilter = document.getElementById("date-filter");
const tbody = document.getElementById("cr-temperature-tbody");

let data = [];

async function fetchData() {
  try {
    const { data: fetchedData, error } = await supabase.functions.invoke(
      "get-coldroom-data"
    );

    if (error) {
      throw error;
    }

    data = fetchedData.data;
    populateFilters();
    renderTable();
  } catch (error) {
    console.error("Error fetching data:", error);
    tbody.innerHTML = `<tr><td colspan="6">Error loading data.</td></tr>`;
  }
}

function populateFilters() {
  const coldrooms = [...new Set(data.map((item) => item.Coldroom))];
  coldroomFilter.innerHTML = `<option value="">All Coldrooms</option>`;
  coldrooms.forEach((coldroom) => {
    const option = document.createElement("option");
    option.value = coldroom;
    option.textContent = coldroom;
    coldroomFilter.appendChild(option);
  });
}

function renderTable() {
  const selectedColdroom = coldroomFilter.value;
  const selectedDate = dateFilter.value;

  const filteredData = data.filter((item) => {
    const itemDate = new Date(item.Date.split("/").reverse().join("-"))
      .toISOString()
      .split("T")[0];
    const coldroomMatch = !selectedColdroom || item.Coldroom === selectedColdroom;
    const dateMatch = !selectedDate || itemDate === selectedDate;
    return coldroomMatch && dateMatch;
  });

  tbody.innerHTML = "";
  if (filteredData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No data found.</td></tr>`;
    return;
  }

  filteredData.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.Coldroom}</td>
      <td>${item.Date}</td>
      <td>${item.Time}</td>
      <td>${item.Temperature}</td>
      <td>${item["Check By"]}</td>
      <td>${item.Remark}</td>
    `;
    tbody.appendChild(row);
  });
}

coldroomFilter.addEventListener("change", renderTable);
dateFilter.addEventListener("change", renderTable);

fetchData();
