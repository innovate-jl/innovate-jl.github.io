const fileInput = document.querySelector('#file-upload');
const dropZone = document.querySelector('#drop-zone');
const selectedFiles = document.querySelector('#selected-files');
const compareButton = document.querySelector('#find-out-now');
const demoButton = document.querySelector('#try-demo');
const clearButton = document.querySelector('#clear-files');
const statusMessage = document.querySelector('#status-message');
const results = document.querySelector('#results');
const resultCount = document.querySelector('#result-count');
const resultList = document.querySelector('#result-list');
const resultExplainer = document.querySelector('#result-explainer');
const emptyResult = document.querySelector('#empty-result');
const downloadButton = document.querySelector('#download-follower-info');
const healthReport = document.querySelector('#export-health');
const healthSummary = document.querySelector('#health-summary');
const healthDetails = document.querySelector('#health-details');

let currentResults = [];
let selected = [];
let historyFile = null;
let latestComparison = null;

function isSupported(file) { return /\.(html|json)$/i.test(file.name) || /^(?:known-following|unifolllow-non-mutual)-\d{4}-\d{2}-\d{2}\.txt$/i.test(file.name); }
function escapeHtml(value) { const node = document.createElement('span'); node.textContent = value; return node.innerHTML; }
function normalizeUsername(value) { return typeof value === 'string' ? value.trim().replace(/^@/, '').toLowerCase() : ''; }
function uniqueUsernames(values) {
  const names = new Map();
  values.forEach(value => { const key = normalizeUsername(value); if (key && !names.has(key)) names.set(key, value.trim().replace(/^@/, '')); });
  return names;
}
function renderFiles() {
  selectedFiles.innerHTML = '';
  selectedFiles.hidden = selected.length === 0;
  clearButton.hidden = selected.length === 0;
  selected.forEach(file => {
    const chip = document.createElement('span');
    chip.className = 'file-chip';
    chip.innerHTML = `<span aria-hidden="true">✓</span>${escapeHtml(file.name)}`;
    selectedFiles.append(chip);
  });
}
function resetOutput() { results.hidden = true; healthReport.hidden = true; latestComparison = null; }
function setFiles(files) {
  selected = [...files].filter(isSupported);
  historyFile = selected.find(file => /^(?:known-following|unifolllow-non-mutual)-\d{4}-\d{2}-\d{2}\.txt$/i.test(file.name)) || null;
  resetOutput();
  statusMessage.textContent = selected.length !== [...files].length ? 'Only .html, .json, and a saved Unifolllow .txt baseline can be used.' : '';
  renderFiles();
}
function requireFiles() {
  const html = selected.filter(file => /\.html$/i.test(file.name));
  const json = selected.filter(file => /\.json$/i.test(file.name));
  const find = (files, name) => files.find(file => file.name.toLowerCase() === name);
  const followerHtmlFiles = html.filter(file => /^followers(?:_\d+)?\.html$/i.test(file.name));
  const followingHtmlFile = find(html, 'following.html');
  const followerJsonFiles = json.filter(file => /^followers(?:_\d+)?\.json$/i.test(file.name));
  const followingJsonFile = find(json, 'following.json');
  if (followerHtmlFiles.length && followingHtmlFile && json.length === 0 && html.length === followerHtmlFiles.length + 1) return { type: 'html', followerFiles: followerHtmlFiles, followingFile: followingHtmlFile };
  if (followerJsonFiles.length && followingJsonFile && html.length === 0 && json.length === followerJsonFiles.length + 1) return { type: 'json', followerFiles: followerJsonFiles, followingFile: followingJsonFile };
  throw new Error('Select every followers_#.html file plus following.html, or every followers_#.json file plus following.json. You can add one saved Unifolllow baseline file.');
}
function usernamesFromHtml(markup) {
  const documentCopy = new DOMParser().parseFromString(markup, 'text/html');
  return [...documentCopy.querySelectorAll('a[href*="instagram.com/"]')].map(link => usernameFromInstagramUrl(link.href)).filter(Boolean);
}
function usernameFromInstagramUrl(href) {
  try {
    const url = new URL(href);
    const segments = url.pathname.split('/').filter(Boolean);
    const marker = segments.findIndex(segment => segment.toLowerCase() === '_u');
    const username = marker >= 0 ? segments[marker + 1] : segments[0];
    return username ? decodeURIComponent(username).replace(/^@/, '') : null;
  } catch { return null; }
}
function usernamesFromJson(data, file, following) {
  const source = following ? data?.relationships_following : data;
  const expected = following ? 'a relationships_following list' : 'a top-level list';
  if (!Array.isArray(source)) throw new Error(`“${file.name}” does not have the expected Instagram structure: ${expected}.`);
  const usernames = source.flatMap(item => (Array.isArray(item?.string_list_data) ? item.string_list_data : []).map(detail => {
    const value = typeof detail?.value === 'string' ? detail.value.trim().replace(/^@/, '') : '';
    return value || usernameFromInstagramUrl(detail?.href);
  }).filter(Boolean));
  if (source.length && !usernames.length) throw new Error(`“${file.name}” does not contain usernames in string_list_data, which this export format requires.`);
  return usernames;
}
async function readJsonFile(file) {
  try { return JSON.parse(await file.text()); }
  catch { throw new Error(`“${file.name}” is not valid JSON. Please choose the original JSON file from your Instagram download.`); }
}
async function readSource(source) {
  if (source.type === 'html') {
    const [followerMarkup, followingMarkup] = await Promise.all([Promise.all(source.followerFiles.map(file => file.text())), source.followingFile.text()]);
    return { followers: followerMarkup.flatMap(usernamesFromHtml), following: usernamesFromHtml(followingMarkup) };
  }
  const [followerData, followingData] = await Promise.all([Promise.all(source.followerFiles.map(readJsonFile)), readJsonFile(source.followingFile)]);
  return { followers: followerData.flatMap((data, index) => usernamesFromJson(data, source.followerFiles[index], false)), following: usernamesFromJson(followingData, source.followingFile, true) };
}
async function compareFiles() {
  statusMessage.textContent = '';
  try {
    const source = requireFiles();
    compareButton.disabled = true;
    compareButton.textContent = 'Comparing…';
    const imported = await readSource(source);
    const previous = historyFile ? new Set((await historyFile.text()).split(/\r?\n/).map(normalizeUsername).filter(Boolean)) : null;
    showComparison(imported, { type: source.type.toUpperCase(), followerFiles: source.followerFiles.length, previous });
  } catch (error) { statusMessage.textContent = error.message || 'We could not read those files. Please try your Instagram export again.'; }
  finally { compareButton.disabled = false; compareButton.textContent = 'Compare files'; }
}
function showComparison(imported, source) {
  const followerMap = uniqueUsernames(imported.followers);
  const followingMap = uniqueUsernames(imported.following);
  const current = [...followingMap.entries()].filter(([key]) => !followerMap.has(key)).sort(([, a], [, b]) => a.localeCompare(b));
  currentResults = current.map(([, name]) => name);
  const currentKeys = new Set(current.map(([key]) => key));
  const newlyIdentified = source.previous ? [...currentKeys].filter(key => !source.previous.has(key)).length : null;
  const resolved = source.previous ? [...source.previous].filter(key => !currentKeys.has(key)).length : null;
  latestComparison = { ...source, followers: followerMap.size, following: followingMap.size, mutual: [...followingMap.keys()].filter(key => followerMap.has(key)).length, newlyIdentified, resolved };
  resultExplainer.textContent = source.previous ? `This is your complete current list. Compared with your saved baseline, ${newlyIdentified} account${newlyIdentified === 1 ? '' : 's'} ${newlyIdentified === 1 ? 'is' : 'are'} newly on it and ${resolved} ${resolved === 1 ? 'account has' : 'accounts have'} left it.` : 'These accounts appear in this following export but not in this followers export. This is a snapshot comparison, not a record of who unfollowed you.';
  renderResults();
  renderHealthReport();
}
function renderHealthReport() {
  const data = latestComparison;
  healthSummary.textContent = `${data.type} export checked • ${data.followerFiles} follower file${data.followerFiles === 1 ? '' : 's'} read`;
  const rows = [['Following accounts read', data.following], ['Follower accounts read', data.followers], ['Mutual accounts in this export', data.mutual], ['Current non-mutual accounts', currentResults.length]];
  if (data.newlyIdentified !== null) rows.push(['New since saved baseline', data.newlyIdentified], ['No longer on the current list', data.resolved]);
  healthDetails.innerHTML = rows.map(([label, value]) => `<div><b>${value}</b><span>${label}</span></div>`).join('');
  healthReport.hidden = false;
}
function renderResults() {
  resultCount.textContent = currentResults.length;
  resultList.innerHTML = '';
  emptyResult.hidden = currentResults.length !== 0;
  currentResults.forEach(username => { const item = document.createElement('li'); item.textContent = username; resultList.append(item); });
  downloadButton.hidden = currentResults.length === 0;
  results.hidden = false;
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function downloadResults() {
  const today = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([currentResults.join('\n')], { type: 'text/plain' }));
  link.download = `unifolllow-non-mutual-${today}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}
function runDemo() {
  selected = []; historyFile = null; fileInput.value = ''; renderFiles();
  statusMessage.textContent = 'Showing sample data only. No Instagram file was uploaded.';
  showComparison({ followers: ['morgan.creates', 'casey.reads', 'Taylor.Travels'], following: ['morgan.creates', 'casey.reads', 'taylor.travels', 'jordan.makes', 'robin.studio'] }, { type: 'SAMPLE', followerFiles: 0, previous: null });
}

fileInput.addEventListener('change', event => setFiles(event.target.files));
['dragenter', 'dragover'].forEach(eventName => dropZone.addEventListener(eventName, event => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
['dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, event => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
dropZone.addEventListener('drop', event => setFiles(event.dataTransfer.files));
compareButton.addEventListener('click', compareFiles);
demoButton.addEventListener('click', runDemo);
clearButton.addEventListener('click', () => { selected = []; historyFile = null; currentResults = []; fileInput.value = ''; statusMessage.textContent = ''; resetOutput(); renderFiles(); });
downloadButton.addEventListener('click', downloadResults);
