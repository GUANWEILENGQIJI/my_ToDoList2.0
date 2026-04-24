import { ref } from 'vue';

const SERVER_URL = 'http://192.168.30.102:3000/';
const serverReachable = ref(true);

let monitorStarted = false;
let monitorTimer = null;
let checking = false;

function checkServerReachable() {
	if (checking) return;
	checking = true;

	uni.request({
		url: SERVER_URL,
		method: 'GET',
		timeout: 2000,
		success: (res) => {
			serverReachable.value = res.statusCode >= 200 && res.statusCode < 500;
		},
		fail: () => {
			serverReachable.value = false;
		},
		complete: () => {
			checking = false;
		}
	});
}

export function startServerStatusMonitor() {
	if (monitorStarted) return;
	monitorStarted = true;
	checkServerReachable();
	monitorTimer = setInterval(checkServerReachable, 4000);
}

export function stopServerStatusMonitor() {
	if (monitorTimer) {
		clearInterval(monitorTimer);
		monitorTimer = null;
	}
	monitorStarted = false;
}

export function getServerReachableRef() {
	return serverReachable;
}

export function refreshServerStatus() {
	checkServerReachable();
}
