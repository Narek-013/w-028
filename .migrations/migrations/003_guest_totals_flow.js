import {
  calculateGuestTotals,
} from './002_guest_totals_collection.js';

const FLOW_NAME = 'Recalculate Guest Totals';
const READ_KEY = 'read_rsvp';
const CALC_KEY = 'calc_totals';
const UPDATE_KEY = 'update_totals';

const CALC_CODE = `module.exports = async function (data) {
  const rows = Array.isArray(data.$last) ? data.$last : (data.$last ? [data.$last] : []);

  let totalGuests = 0;
  let totalAttending = 0;
  let totalDeclined = 0;

  for (const row of rows) {
    if (row.attending) {
      totalAttending += 1;
      totalGuests += Number(row.guest_count) || 0;
    } else {
      totalDeclined += 1;
    }
  }

  return {
    total_guests: totalGuests,
    total_attending: totalAttending,
    total_declined: totalDeclined,
  };
};`;

async function requestJson(client, method, path, body, params) {
  return client.request(() => ({
    path,
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    params,
    body: body ? JSON.stringify(body) : undefined,
  }));
}

function unwrapList(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function unwrapItem(response) {
  return response?.data ?? response;
}

async function deleteExistingFlow(client) {
  const flows = unwrapList(
    await requestJson(client, 'GET', '/flows', null, {
      filter: { name: { _eq: FLOW_NAME } },
      limit: -1,
      fields: ['id'],
    }),
  );

  for (const flow of flows) {
    await requestJson(client, 'DELETE', `/flows/${flow.id}`);
  }

  return flows.length;
}

async function createGuestTotalsFlow(client) {
  const flow = unwrapItem(
    await requestJson(client, 'POST', '/flows', {
      name: FLOW_NAME,
      icon: 'bolt',
      color: null,
      description: 'Updates guest_totals whenever RSVP items change',
      status: 'active',
      trigger: 'event',
      accountability: 'all',
      options: {
        type: 'action',
        scope: ['items.create', 'items.update', 'items.delete'],
        collections: ['rsvp'],
      },
    }),
  );

  const flowId = flow?.id;
  if (!flowId) {
    throw new Error('Failed to create guest totals flow');
  }

  const readOp = unwrapItem(
    await requestJson(client, 'POST', '/operations', {
      flow: flowId,
      name: 'Read RSVP Items',
      key: READ_KEY,
      type: 'item-read',
      position_x: 19,
      position_y: 1,
      options: {
        collection: 'rsvp',
        permissions: '$full',
        query: {
          fields: ['guest_count', 'attending'],
          limit: -1,
        },
      },
    }),
  );

  const calcOp = unwrapItem(
    await requestJson(client, 'POST', '/operations', {
      flow: flowId,
      name: 'Calculate Totals',
      key: CALC_KEY,
      type: 'exec',
      position_x: 37,
      position_y: 1,
      options: {
        code: CALC_CODE,
      },
    }),
  );

  const updateOp = unwrapItem(
    await requestJson(client, 'POST', '/operations', {
      flow: flowId,
      name: 'Update Guest Totals',
      key: UPDATE_KEY,
      type: 'item-update',
      position_x: 55,
      position_y: 1,
      options: {
        collection: 'guest_totals',
        permissions: '$full',
        payload: '{{$last}}',
      },
    }),
  );

  if (!readOp?.id || !calcOp?.id || !updateOp?.id) {
    throw new Error('Failed to create one or more guest totals flow operations');
  }

  await requestJson(client, 'PATCH', `/operations/${readOp.id}`, {
    resolve: calcOp.id,
  });

  await requestJson(client, 'PATCH', `/operations/${calcOp.id}`, {
    resolve: updateOp.id,
  });

  await requestJson(client, 'PATCH', `/flows/${flowId}`, {
    operation: readOp.id,
  });

  return flowId;
}

export async function up(client) {
  const removed = await deleteExistingFlow(client);
  const flowId = await createGuestTotalsFlow(client);
  const totals = await calculateGuestTotals(client);

  console.log(
    `Guest totals flow rebuilt: removed=${removed}, flow_id=${flowId}, total_guests=${totals.totalGuests}, total_attending=${totals.totalAttending}, total_declined=${totals.totalDeclined}`,
  );
  console.log('Restart Directus after this migration so the event flow is registered.');
}
