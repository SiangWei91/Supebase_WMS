import { supabase } from './supabase-client.js';

export async function loadShipmentPage() {
  const tabContainer = document.querySelector('.tab-container');
  tabContainer.addEventListener('click', async (event) => {
    const tab = event.target.closest('.tab');
    if (tab) {
      await openTab(event, tab.dataset.tab);
    }
  });

  // Load the shipment list by default
  const shipmentListTab = document.querySelector('[data-tab="shipment-list"]');
  if (shipmentListTab) {
    await openTab({ currentTarget: shipmentListTab }, 'shipment-list');
  }
}

async function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tab-content");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tab");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";

  if (tabName === 'shipment-list') {
    const shipmentListContainer = document.getElementById('shipment-list');
    shipmentListContainer.innerHTML = `
      <h2>Shipment List</h2>
      <div id="shipment-list-loading">
        <div class="spinner"></div>
      </div>
      <div id="shipment-list-table"></div>
    `;

    const loadingIndicator = document.getElementById('shipment-list-loading');
    const tableContainer = document.getElementById('shipment-list-table');

    setTimeout(async () => {
      const data = await getShipmentList();

      loadingIndicator.style.display = 'none';

      if (data) {
        const table = renderShipmentTable(data);
        tableContainer.appendChild(table);
      }
    }, 0);
  }
}

async function getShipmentList() {
  const { data, error } = await supabase.functions.invoke('shipment-list', {
    method: 'GET',
  });

  if (error) {
    console.error('Error fetching shipment list:', error);
    return;
  }

  return data;
}

function renderShipmentTable(data, showActions = true) {
  const table = document.createElement('table');
  table.classList.add('data-table');

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = data.values[0];
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });

  if (showActions) {
    const th = document.createElement('th');
    th.textContent = 'Actions';
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let i = 1; i < data.values.length; i++) {
    const rowData = data.values[i];
    const row = document.createElement('tr');
    rowData.forEach(cellData => {
      const td = document.createElement('td');
      td.textContent = cellData;
      row.appendChild(td);
    });

    if (showActions) {
      const viewButton = document.createElement('button');
      viewButton.textContent = 'View';
      viewButton.classList.add('btn-icon', 'view-btn');
      viewButton.addEventListener('click', () => handleViewShipment(rowData[0]));
      const actionsTd = document.createElement('td');
      actionsTd.appendChild(viewButton);
      row.appendChild(actionsTd);
    }

    tbody.appendChild(row);
  }
  table.appendChild(tbody);

  return table;
}

async function getShipmentDetails(shipmentNo) {
  const { data, error } = await supabase.functions.invoke(`shipment-details?shipment=${shipmentNo}`, {
    method: 'GET',
  });

  if (error) {
    console.error('Error fetching shipment details:', error);
    return;
  }

  return data;
}

function handleViewShipment(shipmentNo) {
  openShipmentDetailsTab(shipmentNo);
}

async function openShipmentDetailsTab(shipmentNo) {
  const tabContainer = document.querySelector('.tab-container');
  const contentArea = document.querySelector('.shipment-content-area');

  // Create new tab
  const newTab = document.createElement('div');
  newTab.classList.add('tab');
  newTab.dataset.tab = `shipment-details-${shipmentNo}`;

  const tabTitle = document.createElement('span');
  tabTitle.textContent = shipmentNo;
  newTab.appendChild(tabTitle);

  const closeButton = document.createElement('button');
  closeButton.classList.add('close-tab');
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(newTab.dataset.tab);
  });
  newTab.appendChild(closeButton);

  tabContainer.appendChild(newTab);

  // Create new tab content
  const newContent = document.createElement('div');
  newContent.id = `shipment-details-${shipmentNo}`;
  newContent.classList.add('tab-content');
  newContent.innerHTML = `<h2>${shipmentNo}</h2><div class="spinner"></div>`;
  contentArea.appendChild(newContent);

  // Switch to new tab
  openTab({ currentTarget: newTab }, newTab.dataset.tab);

  const data = await getShipmentDetails(shipmentNo);

  if (data) {
    const table = renderShipmentTable(data, false);
    newContent.innerHTML = `<h2>${shipmentNo}</h2>`;
    newContent.appendChild(table);
  } else {
    newContent.innerHTML = `<h2>${shipmentNo}</h2><p>Could not load shipment details.</p>`;
  }
}

function closeTab(tabName) {
  const tab = document.querySelector(`[data-tab="${tabName}"]`);
  const content = document.getElementById(tabName);

  if (tab) {
    tab.remove();
  }
  if (content) {
    content.remove();
  }

  // Switch to the shipment list tab
  const shipmentListTab = document.querySelector('[data-tab="shipment-list"]');
  openTab({ currentTarget: shipmentListTab }, 'shipment-list');
}
