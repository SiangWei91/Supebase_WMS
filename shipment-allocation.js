import * as XLSX from 'xlsx';

const shipmentModuleState = {
    allExtractedData: {},
    viewDefinitions: [
        { name: 'Jordon',    displayName: 'Jordon',    filterColumnLetter: 'C' },
        { name: 'Lineage',   displayName: 'Lineage',   filterColumnLetter: 'D' },
        { name: 'Blk 15',    displayName: 'Blk15',     filterColumnLetter: 'E', columns: ['A', 'B', 'C'] },
        { name: 'Coldroom 6',displayName: 'Coldroom 6',filterColumnLetter: 'F', columns: ['A', 'B', 'C'] },
        { name: 'Coldroom 5',displayName: 'Coldroom 5',filterColumnLetter: 'G', columns: ['A', 'B', 'C'] }
    ],
    isInitialized: false,
    currentResultsContainer: null,
    currentShipmentTabNav: null,
    updateInventoryBtn: null
  };

export function loadShipmentAllocationPage() {
    const fileInput = document.getElementById('excelFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFile, false);
    }
}

function handleFile(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        processWorkbook(workbook);
    };
    reader.readAsArrayBuffer(file);
}

function processWorkbook(workbook) {
    const sheet1 = workbook.Sheets[workbook.SheetNames[0]];
    const sheet1Data = XLSX.utils.sheet_to_json(sheet1, {header: 1, defval: ''});

    const sheet1LookupMap = new Map();
    sheet1Data.forEach(row => {
        const itemCode = String(row[0] || '').trim();
        if (itemCode) {
            sheet1LookupMap.set(itemCode, {
                packingSize: String(row[2] || '').trim(),
                batchNo: String(row[3] || '').trim()
            });
        }
    });

    shipmentModuleState.viewDefinitions.forEach(view => {
        const sheet = workbook.Sheets[view.name];
        if (sheet) {
            const sheetData = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});
            if (view.name === 'Jordon') {
                shipmentModuleState.allExtractedData[view.name] = extractJordonData(sheet, sheet1LookupMap);
            } else if (view.name === 'Lineage') {
                shipmentModuleState.allExtractedData[view.name] = extractLineageData(sheet, sheet1LookupMap);
            } else {
                shipmentModuleState.allExtractedData[view.name] = extractDataForView(sheetData, view, sheet1LookupMap);
            }
        }
    });

    displayExtractedData(shipmentModuleState.allExtractedData[shipmentModuleState.viewDefinitions[0].name]);
    setupTabs();
    updateButtonState();
}

function getColumnIndex(letter) {
    let index = 0;
    for (let i = 0; i < letter.length; i++) {
        index = index * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return index - 1;
}

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function reformatDateToDDMMYYYY(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        let [month, day, year] = parts;
        month = month.padStart(2, '0');
        day = day.padStart(2, '0');
        if (year.length === 2) {
            year = '20' + year;
        } else if (year.length === 4) {
            // keep as is
        } else {
             return dateStr;
        }
        return `${day}/${month}/${year}`;
    }
    return dateStr;
}

function extractJordonData(jordonSheet, sheet1LookupMap) {
    const extractedItems = [];
    if (!jordonSheet) return extractedItems;
    const jordonSheetData = XLSX.utils.sheet_to_json(jordonSheet, { header: 1, defval: '' });
    for (let rowIndex = 14; rowIndex < jordonSheetData.length; rowIndex++) {
        const row = jordonSheetData[rowIndex];
        if (!row) continue;
        const productDescription = row[2] ? String(row[2]).trim() : "";
        if (productDescription === "") break;
        const itemCode = row[8] ? String(row[8]).trim() : "";
        const packingSize = row[3] ? String(row[3]).trim() : "";
        let batchNo = "";
        const batchNoCellAddress = 'G' + (rowIndex + 1);
        const batchNoCell = jordonSheet[batchNoCellAddress];
        if (batchNoCell && batchNoCell.w) {
            batchNo = String(batchNoCell.w).trim();
            batchNo = reformatDateToDDMMYYYY(batchNo);
        } else if (batchNoCell && batchNoCell.v !== undefined) {
            let potentialDateStr = String(batchNoCell.v).trim();
            if (potentialDateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
                 batchNo = reformatDateToDDMMYYYY(potentialDateStr);
            } else {
                 batchNo = potentialDateStr;
            }
        }
        const quantity = row[5] ? String(row[5]).trim() : "";
        let rawPalletValueFromCell;
        if (row[4] === 0) {
            rawPalletValueFromCell = "0";
        } else if (row[4]) {
            rawPalletValueFromCell = String(row[4]).trim();
        } else {
            rawPalletValueFromCell = "";
        }
        let pallet = rawPalletValueFromCell;
        const indexOfX = rawPalletValueFromCell.indexOf('x');
        if (indexOfX > -1) {
            pallet = rawPalletValueFromCell.substring(indexOfX + 1).trim();
        }
        const item = { itemCode, productDescription, packingSize, batchNo, quantity, pallet, excelRowNumber: rowIndex + 1 };
        extractedItems.push(item);
    }
    return extractedItems;
}

function extractLineageData(lineageSheet, sheet1LookupMap) {
    const extractedItems = [];
    if (!lineageSheet) return extractedItems;
    const lineageSheetData = XLSX.utils.sheet_to_json(lineageSheet, { header: 1, defval: '' });
    for (let rowIndex = 14; rowIndex < lineageSheetData.length; rowIndex++) {
        const row = lineageSheetData[rowIndex];
        if (!row) continue;

        const productDescription = row[2] ? String(row[2]).trim() : "";
        if (productDescription === "") break;

        const llmItemCode = row[3] ? String(row[3]).trim() : "";

        const packingSize = row[4] ? String(row[4]).trim() : "";

        let rawPalletValueFromCell;
        if (row[5] === 0) {
            rawPalletValueFromCell = "0";
        } else if (row[5]) {
            rawPalletValueFromCell = String(row[5]).trim();
        } else {
            rawPalletValueFromCell = "";
        }
        let pallet = rawPalletValueFromCell;
        const indexOfX = rawPalletValueFromCell.indexOf('x');
        if (indexOfX > -1) {
            pallet = rawPalletValueFromCell.substring(indexOfX + 1).trim();
        }

        const quantity = row[7] ? String(row[7]).trim() : "";

        let batchNo = "";
        const batchNoCellAddress = XLSX.utils.encode_cell({c: 8, r: rowIndex});
        const batchNoCell = lineageSheet[batchNoCellAddress];
        if (batchNoCell && batchNoCell.w) {
            batchNo = String(batchNoCell.w).trim();
            batchNo = reformatDateToDDMMYYYY(batchNo);
        } else if (batchNoCell && batchNoCell.v !== undefined) {
            let potentialDateStr = String(batchNoCell.v).trim();
            if (potentialDateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
                 batchNo = reformatDateToDDMMYYYY(potentialDateStr);
            } else {
                 batchNo = potentialDateStr;
            }
        }

        const itemCode = row[9] ? String(row[9]).trim() : "";

        const item = {
            itemCode,
            productDescription,
            llmItemCode,
            packingSize,
            batchNo,
            quantity,
            pallet,
            excelRowNumber: rowIndex + 1
        };
        extractedItems.push(item);
    }
    return extractedItems;
}

function extractDataForView(sheetData, viewConfig, sheet1LookupMap) {
    const viewResults = [];
    if (!sheetData || sheetData.length === 0) return viewResults;
    const itemCodeColIndexInConvert = getColumnIndex(viewConfig.columns[0]);
    const descriptionColIndexInConvert = getColumnIndex(viewConfig.columns[1]);
    const quantityColIndexInConvert = getColumnIndex(viewConfig.columns[2]);
    const filterColumnIndex = getColumnIndex(viewConfig.filterColumnLetter);
    for (let i = 0; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!row) continue;
        const itemCodeValue = row[itemCodeColIndexInConvert];
        const preppedItemCodeForCheck = (itemCodeValue === null || itemCodeValue === undefined) ? "" : String(itemCodeValue).trim();
        if (preppedItemCodeForCheck === '0') break;
        const itemCodeString = String(itemCodeValue || '').trim();
        const filterValueRaw = row[filterColumnIndex];
        const filterValueNumeric = parseFloat(filterValueRaw);
        if (!isNaN(filterValueNumeric) && filterValueNumeric !== 0) {
            const productDescriptionValue = row[descriptionColIndexInConvert];
            const quantityValue = row[quantityColIndexInConvert];
            const enrichmentData = sheet1LookupMap.get(itemCodeString);
            const packingSizeValue = enrichmentData ? enrichmentData.packingSize : '';
            const batchNoValue = enrichmentData ? enrichmentData.batchNo : '';
            viewResults.push({
                itemCode: itemCodeValue !== undefined ? itemCodeValue : '',
                productDescription: productDescriptionValue !== undefined ? productDescriptionValue : '',
                quantity: quantityValue !== undefined ? quantityValue : '',
                packingSize: packingSizeValue,
                batchNo: batchNoValue
            });
        }
    }
    return viewResults;
}

function setupTabs() {
    const tabNav = document.getElementById('shipmentTabNav');
    tabNav.innerHTML = '';
    tabNav.style.display = 'flex';

    shipmentModuleState.viewDefinitions.forEach((view, index) => {
        if (shipmentModuleState.allExtractedData[view.name] && shipmentModuleState.allExtractedData[view.name].length > 0) {
            const tab = document.createElement('button');
            tab.textContent = view.displayName;
            tab.dataset.viewName = view.name;
            tab.className = 'tab-link';
            if (index === 0) {
                tab.classList.add('active-tab');
            }
            tab.onclick = () => {
                document.querySelectorAll('#shipmentTabNav .tab-link').forEach(t => t.classList.remove('active-tab'));
                tab.classList.add('active-tab');
                displayExtractedData(shipmentModuleState.allExtractedData[view.name]);
            };
            tabNav.appendChild(tab);
        }
    });
}

function displayExtractedData(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    shipmentModuleState.currentResultsContainer = resultsContainer;
    if (!resultsContainer) return;

    let html = '';
    if (!data || data.length === 0) {
        html += '<p>No data to display for this view.</p>';
    } else {
        const activeViewName = getActiveViewName();
        let headers = ['Item Code', 'Product Description', 'Packing Size', 'Batch No', 'Quantity'];
        let currentDataKeys = ['itemCode', 'productDescription', 'packingSize', 'batchNo', 'quantity'];

        if (activeViewName === 'Lineage') {
            headers.splice(headers.indexOf('Product Description') + 1, 0, 'LLM Item Code');
            currentDataKeys.splice(currentDataKeys.indexOf('productDescription') + 1, 0, 'llmItemCode');
        }

        if (activeViewName === 'Jordon' || activeViewName === 'Lineage') {
            headers.splice(headers.indexOf('Quantity') + 1, 0, 'Pallet');
            currentDataKeys.splice(currentDataKeys.indexOf('quantity') + 1, 0, 'pallet');
        }
        headers.push('Remove');
        html += '<table border="1"><thead><tr>';
        headers.forEach(h => {
            html += `<th>${escapeHtml(h)}</th>`;
        });
        html += '</tr></thead><tbody>';
        data.forEach((item, rowIndex) => {
            html += `<tr data-row-index="${rowIndex}">`;
            currentDataKeys.forEach(key => {
                const value = item[key] !== undefined ? item[key] : '';
                html += `<td><input type="text" class="editable-cell-input" data-row-index="${rowIndex}" data-column-key="${escapeHtml(key)}" value="${escapeHtml(value)}"></td>`;
            });
            html += `<td><button class="remove-row-btn" data-row-index="${rowIndex}">X</button></td>`;
            html += '</tr>';
        });
        html += '</tbody>';

        let totalQuantity = 0;
        let totalPallets = 0;

        data.forEach(item => {
            totalQuantity += parseFloat(item.quantity || 0);
            if ((activeViewName === 'Jordon' || activeViewName === 'Lineage') && item.pallet !== undefined) {
                totalPallets += parseFloat(item.pallet || 0);
            }
        });

        html += '<tfoot><tr>';

        const quantityColIdx = currentDataKeys.indexOf('quantity');
        const palletColIdx = (activeViewName === 'Jordon' || activeViewName === 'Lineage') ? currentDataKeys.indexOf('pallet') : -1;
        const numFooterCells = currentDataKeys.length + 1;
        const footerCells = new Array(numFooterCells).fill('<td></td>');

        if (quantityColIdx !== -1) {
            const batchNoColIdx = currentDataKeys.indexOf('batchNo');
            if (batchNoColIdx !== -1 && batchNoColIdx < quantityColIdx) {
                footerCells[batchNoColIdx] = `<td><strong>Total Quantity:</strong></td>`;
            } else if (quantityColIdx > 0) {
                 footerCells[quantityColIdx - 1] = `<td><strong>Total Quantity:</strong></td>`;
            }
            footerCells[quantityColIdx] = `<td><strong>${totalQuantity.toLocaleString()}</strong></td>`;
        }

        if (palletColIdx !== -1) {
            const packingSizeColIdx = currentDataKeys.indexOf('packingSize');
            if (packingSizeColIdx !== -1 && packingSizeColIdx < palletColIdx && footerCells[packingSizeColIdx] === '<td></td>') {
                footerCells[packingSizeColIdx] = `<td><strong>Total Pallets:</strong></td>`;
            } else if (palletColIdx > 0 && footerCells[palletColIdx - 1] === '<td></td>') {
                 footerCells[palletColIdx - 1] = `<td><strong>Total Pallets:</strong></td>`;
            }
            footerCells[palletColIdx] = `<td><strong>${totalPallets.toLocaleString()}</strong></td>`;
        }

        html += footerCells.join('');
        html += '</tr></tfoot></table>';
    }
    resultsContainer.innerHTML = html;
}

function getActiveViewName() {
    const tabNavEl = document.getElementById('shipmentTabNav');
    if (!tabNavEl) return shipmentModuleState.viewDefinitions.length > 0 ? shipmentModuleState.viewDefinitions[0].name : null;
    const activeTab = tabNavEl.querySelector('.active-tab');
    return (activeTab && activeTab.dataset.viewName) ? activeTab.dataset.viewName : (shipmentModuleState.viewDefinitions.length > 0 ? shipmentModuleState.viewDefinitions[0].name : null);
}

function updateButtonState() {
    const updateBtn = document.getElementById('updateInventoryBtn');
    if (updateBtn) {
        const hasData = Object.values(shipmentModuleState.allExtractedData).some(data => data.length > 0);
        updateBtn.style.display = hasData ? 'block' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        resultsContainer.addEventListener('change', handleCellEdit);
        resultsContainer.addEventListener('click', handleRowRemoveClick);
    }

    const updateBtn = document.getElementById('updateInventoryBtn');
    if (updateBtn) {
        updateBtn.addEventListener('click', updateInventory);
    }
});

function handleCellEdit(event) {
    if (event.target.classList.contains('editable-cell-input')) {
        const rowIndex = parseInt(event.target.dataset.rowIndex, 10);
        const columnKey = event.target.dataset.columnKey;
        const newValue = event.target.value;
        const activeViewName = getActiveViewName();
        if (activeViewName && shipmentModuleState.allExtractedData[activeViewName] && shipmentModuleState.allExtractedData[activeViewName][rowIndex]) {
            shipmentModuleState.allExtractedData[activeViewName][rowIndex][columnKey] = newValue;
        }
    }
}

async function updateInventory() {
    const allItems = [];
    for (const viewName in shipmentModuleState.allExtractedData) {
        const viewData = shipmentModuleState.allExtractedData[viewName];
        const warehouseInfo = await getWarehouseInfo(viewName);
        viewData.forEach(item => {
            allItems.push({ ...item, warehouseId: warehouseInfo.warehouseId });
        });
    }

    const updates = [];
    for (const item of allItems) {
        const { productId } = await lookupOrCreateProduct(item.itemCode, item.productDescription, item.packingSize);
        if (productId) {
            updates.push({
                product_id: productId,
                warehouse_id: item.warehouseId,
                quantity: item.quantity,
                batch_no: item.batchNo,
                pallet: item.pallet
            });
        }
    }

    try {
        const { error } = await supabase.from('inventory').upsert(updates, { onConflict: ['product_id', 'warehouse_id', 'batch_no'] });
        if (error) {
            throw error;
        }
        alert('Inventory updated successfully!');
    } catch (error) {
        console.error('Error updating inventory:', error);
        alert('Error updating inventory: ' + error.message);
    }
}

async function getWarehouseInfo(viewDisplayName) {
    let warehouseIdKey = '';
    switch (viewDisplayName) {
        case 'Jordon': warehouseIdKey = 'jordon'; break;
        case 'Lineage': warehouseIdKey = 'lineage'; break;
        case 'Blk15': warehouseIdKey = 'blk15'; break;
        case 'Coldroom 6': warehouseIdKey = 'coldroom6'; break;
        case 'Coldroom 5': warehouseIdKey = 'coldroom5'; break;
        default:
            const generatedId = viewDisplayName.toLowerCase().replace(/\s+/g, '');
            warehouseIdKey = generatedId;
    }

    try {
        const { data: warehouseData, error } = await supabase
            .from('warehouses')
            .select('id')
            .eq('id', warehouseIdKey)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                 return { warehouseId: warehouseIdKey, error: `Warehouse doc ${warehouseIdKey} not found in Supabase` };
            }
            throw error;
        }

        if (warehouseData) {
            return { warehouseId: warehouseData.id };
        } else {
            return { warehouseId: warehouseIdKey, error: `Warehouse doc ${warehouseIdKey} not found (no data returned)` };
        }
    } catch (error) {
        console.error(`Error fetching warehouse ${warehouseIdKey} from Supabase:`, error);
        return { warehouseId: warehouseIdKey, error: `Error fetching warehouse ${warehouseIdKey}: ${error.message}` };
    }
}

function handleRowRemoveClick(event) {
    if (event.target.classList.contains('remove-row-btn')) {
        const rowIndex = parseInt(event.target.dataset.rowIndex, 10);
        const activeViewName = getActiveViewName();
        if (activeViewName && shipmentModuleState.allExtractedData[activeViewName]) {
            shipmentModuleState.allExtractedData[activeViewName].splice(rowIndex, 1);
            displayExtractedData(shipmentModuleState.allExtractedData[activeViewName]);
            updateButtonState();
        }
    }
}
