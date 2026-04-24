import { ref } from 'vue';

const BASE_URL = 'http://192.168.30.102:3000';
const TODOS_LOCAL_KEY = 'todos_local_v2';
const PENDING_ACTIONS_KEY = 'pending_actions_v2';
const LAST_SYNC_AT_KEY = 'todos_last_sync_at_v2';
let syncing = false;
const syncState = ref('synced');

function request(url, method = 'GET', data) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${BASE_URL}${url}`,
			method,
			data,
			timeout: 3000,
			success: (res) => resolve(res.data),
			fail: (err) => reject(err)
		});
	});
}

function readJson(key, fallback) {
	const raw = uni.getStorageSync(key);
	if (!raw) return fallback;
	try {
		return JSON.parse(raw);
	} catch (error) {
		return fallback;
	}
}

function writeJson(key, value) {
	uni.setStorageSync(key, JSON.stringify(value));
}

function now() {
	return Date.now();
}

function createId() {
	return `todo-${now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTodo(todo) {
	return {
		id: todo.id,
		title: todo.title || '',
		link: todo.link || '',
		content: todo.content || '',
		image: todo.image || '',
		timestamp: Number(todo.timestamp) || now(),
		isDone: Boolean(todo.isDone),
		doneTime: todo.doneTime ?? null,
		deleted: Boolean(todo.deleted),
		updatedAt: Number(todo.updatedAt) || now()
	};
}

function readLocalTodos() {
	return readJson(TODOS_LOCAL_KEY, []).map(normalizeTodo);
}

function writeLocalTodos(todos) {
	writeJson(TODOS_LOCAL_KEY, todos.map(normalizeTodo));
}

function readPendingActions() {
	return readJson(PENDING_ACTIONS_KEY, []);
}

function writePendingActions(actions) {
	writeJson(PENDING_ACTIONS_KEY, actions);
	syncState.value = actions.length > 0 ? 'unsynced' : 'synced';
}

function getLastSyncAt() {
	return Number(uni.getStorageSync(LAST_SYNC_AT_KEY) || 0);
}

syncState.value = readPendingActions().length > 0 ? 'unsynced' : 'synced';

function setLastSyncAt(value) {
	uni.setStorageSync(LAST_SYNC_AT_KEY, String(value));
}

function upsertLocalTodo(todo) {
	const todos = readLocalTodos();
	const index = todos.findIndex((item) => String(item.id) === String(todo.id));
	const nextTodo = normalizeTodo(todo);
	if (index === -1) {
		todos.push(nextTodo);
	} else {
		todos[index] = nextTodo;
	}
	writeLocalTodos(todos);
	return nextTodo;
}

function getLocalTodo(id) {
	return readLocalTodos().find((item) => String(item.id) === String(id));
}

function queueAction(type, todoId) {
	const actions = readPendingActions();
	actions.push({
		type,
		todoId,
		queuedAt: now()
	});
	writePendingActions(actions);
}

function removeQueuedActionAt(index) {
	const actions = readPendingActions();
	actions.splice(index, 1);
	writePendingActions(actions);
}

function hasPendingActionsForTodo(id) {
	return readPendingActions().some((item) => String(item.todoId) === String(id));
}

function getVisibleTodos(status) {
	let todos = readLocalTodos().filter((item) => item.deleted !== true);

	if (status === 'todo') {
		todos = todos.filter((item) => item.isDone === false);
	}

	if (status === 'done') {
		todos = todos.filter((item) => item.isDone === true);
	}

	return todos;
}

function toTodoPayload(todo) {
	return {
		id: todo.id,
		title: todo.title,
		link: todo.link,
		content: todo.content,
		image: todo.image,
		timestamp: todo.timestamp,
		isDone: todo.isDone,
		doneTime: todo.doneTime,
		deleted: todo.deleted,
		updatedAt: todo.updatedAt
	};
}

function mergeRemoteTodos(remoteTodos) {
	const localTodos = readLocalTodos();
	const localMap = new Map(localTodos.map((item) => [String(item.id), item]));
	let maxUpdatedAt = getLastSyncAt();

	remoteTodos.forEach((remote) => {
		const normalized = normalizeTodo(remote);
		const id = String(normalized.id);
		const local = localMap.get(id);
		const pending = hasPendingActionsForTodo(id);

		if (!local) {
			localMap.set(id, normalized);
		} else if (!pending && Number(normalized.updatedAt) >= Number(local.updatedAt || 0)) {
			localMap.set(id, normalized);
		}

		if (Number(normalized.updatedAt) > maxUpdatedAt) {
			maxUpdatedAt = Number(normalized.updatedAt);
		}
	});

	writeLocalTodos(Array.from(localMap.values()));
	setLastSyncAt(maxUpdatedAt);
}

export async function getTodos(status) {
	return {
		code: 0,
		message: 'success',
		data: getVisibleTodos(status)
	};
}

export function getCachedTodos(status) {
	return getVisibleTodos(status);
}

export async function getTodoById(id) {
	const todo = getLocalTodo(id);
	if (!todo || todo.deleted) {
		return {
			code: 404,
			message: '未找到该待办事项'
		};
	}

	return {
		code: 0,
		message: 'success',
		data: todo
	};
}

export function getTodoByIdFromCache(id) {
	return getLocalTodo(id);
}

export async function createTodoLocal(data) {
	const localTodo = normalizeTodo({
		id: data.id || createId(),
		title: data.title,
		link: data.link,
		content: data.content,
		image: data.image,
		timestamp: data.timestamp,
		isDone: false,
		doneTime: null,
		deleted: false,
		updatedAt: now()
	});

	upsertLocalTodo(localTodo);
	queueAction('create', localTodo.id);

	return {
		code: 0,
		message: 'success',
		data: localTodo
	};
}

export async function updateTodoLocal(id, data) {
	const existing = getLocalTodo(id);
	if (!existing || existing.deleted) {
		return {
			code: 404,
			message: '未找到该待办事项'
		};
	}

	const nextTodo = normalizeTodo({
		...existing,
		title: data.title,
		link: data.link,
		content: data.content,
		image: data.image,
		timestamp: data.timestamp,
		updatedAt: now()
	});

	upsertLocalTodo(nextTodo);
	queueAction('update', id);

	return {
		code: 0,
		message: 'success',
		data: nextTodo
	};
}

export async function markTodoDoneLocal(id) {
	const existing = getLocalTodo(id);
	if (!existing || existing.deleted) {
		return {
			code: 404,
			message: '未找到该待办事项'
		};
	}

	const nextTodo = normalizeTodo({
		...existing,
		isDone: true,
		doneTime: now(),
		updatedAt: now()
	});

	upsertLocalTodo(nextTodo);
	queueAction('done', id);

	return {
		code: 0,
		message: 'success',
		data: nextTodo
	};
}

export async function markTodoTodoLocal(id) {
	const existing = getLocalTodo(id);
	if (!existing || existing.deleted) {
		return {
			code: 404,
			message: '未找到该待办事项'
		};
	}

	const nextTodo = normalizeTodo({
		...existing,
		isDone: false,
		doneTime: null,
		updatedAt: now()
	});

	upsertLocalTodo(nextTodo);
	queueAction('todo', id);

	return {
		code: 0,
		message: 'success',
		data: nextTodo
	};
}

export async function deleteTodoLocal(id) {
	const existing = getLocalTodo(id);
	if (!existing || existing.deleted) {
		return {
			code: 404,
			message: '未找到该待办事项'
		};
	}

	const nextTodo = normalizeTodo({
		...existing,
		deleted: true,
		updatedAt: now()
	});

	upsertLocalTodo(nextTodo);
	queueAction('delete', id);

	return {
		code: 0,
		message: 'success',
		data: nextTodo
	};
}

async function pushAction(action) {
	const todo = getLocalTodo(action.todoId);

	if (action.type === 'create') {
		if (!todo || todo.deleted) return true;
		const res = await request('/api/todos', 'POST', toTodoPayload(todo));
		return res.code === 0;
	}

	if (action.type === 'update') {
		if (!todo || todo.deleted) return true;
		const res = await request(`/api/todos/${action.todoId}`, 'PUT', toTodoPayload(todo));
		return res.code === 0;
	}

	if (action.type === 'done') {
		if (!todo || todo.deleted) return true;
		const res = await request(`/api/todos/${action.todoId}/done`, 'PUT');
		return res.code === 0;
	}

	if (action.type === 'todo') {
		if (!todo || todo.deleted) return true;
		const res = await request(`/api/todos/${action.todoId}/todo`, 'PUT');
		return res.code === 0;
	}

	if (action.type === 'delete') {
		const res = await request(`/api/todos/${action.todoId}`, 'DELETE');
		return res.code === 0 || res.code === 404;
	}

	return true;
}

export async function syncPendingActions() {
	if (syncing) {
		return {
			code: 0,
			message: 'sync-skipped'
		};
	}

	syncing = true;
	syncState.value = 'syncing';
	const queue = readPendingActions();

	try {
		for (let index = 0; index < queue.length; index += 1) {
			const action = queue[index];
			try {
				const success = await pushAction(action);
				if (!success) {
					syncState.value = 'unsynced';
					return {
						code: 500,
						message: 'sync-stopped'
					};
				}
				removeQueuedActionAt(0);
			} catch (error) {
				syncState.value = 'unsynced';
				return {
					code: 500,
					message: 'offline'
				};
			}
		}

		const updatedAfter = getLastSyncAt();
		const res = await request(`/api/todos/sync?updatedAfter=${updatedAfter}`, 'GET');
		if (res.code === 0) {
			mergeRemoteTodos(res.data || []);
		}
		syncState.value = readPendingActions().length > 0 ? 'unsynced' : 'synced';
		return {
			code: 0,
			message: 'success'
		};
	} catch (error) {
		syncState.value = readPendingActions().length > 0 ? 'unsynced' : 'synced';
		return {
			code: 500,
			message: 'offline'
		};
	} finally {
		syncing = false;
	}
}

export function getPendingActionCount() {
	return readPendingActions().length;
}

export function getSyncStateRef() {
	return syncState;
}

export async function checkVersion(platform, currentVersionCode) {
	return request(`/api/version/check?platform=${platform}&currentVersionCode=${currentVersionCode}`, 'GET');
}
