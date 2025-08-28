function showTab(tabId) {
document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
document.getElementById(tabId).classList.remove('hidden');
}


function logout() {
localStorage.removeItem('token');
window.location.href = 'index.html';
}


function authHeader() {
return { 'Authorization': 'Bearer ' + localStorage.getItem('token') };
}


function showError(msg) {
alert('❌ ' + msg);
}


function showSuccess(msg) {
alert('✅ ' + msg);
}