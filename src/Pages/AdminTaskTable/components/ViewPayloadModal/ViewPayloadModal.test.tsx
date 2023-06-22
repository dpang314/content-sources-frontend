import {
  defaultIntrospectTask,
  defaultSnapshotTask,
  ReactQueryTestWrapper,
} from '../../../../testingHelpers';
import ViewPayloadModal from './ViewPayloadModal';
import { fireEvent, render } from '@testing-library/react';
import { AdminTask } from '../../../../services/AdminTasks/AdminTaskApi';

jest.mock('../../../../services/Notifications/Notifications', () => ({
  useNotification: () => ({ notify: () => null }),
}));

jest.mock('../../../../services/useDebounce', () => (value) => value);
jest.mock('../../../../middleware/AppContext', () => ({ useAppContext: () => ({}) }));

it('Render loading spinner', async () => {
  render(
    <ReactQueryTestWrapper>
      <ViewPayloadModal open isFetching={true} adminTask={null} setClosed={() => undefined} />
    </ReactQueryTestWrapper>,
  );
});

it('Open introspect task details and click tabs', async () => {
  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <ViewPayloadModal
        open
        isFetching={false}
        adminTask={defaultIntrospectTask}
        setClosed={() => undefined}
      />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText(defaultIntrospectTask.uuid)).toBeInTheDocument();

  const detailsTab = queryByText('Task details');
  expect(detailsTab).toBeInTheDocument();
  const detailsContent = document.getElementById('task-details');
  expect(detailsContent).toBeInTheDocument();
  expect(detailsContent).not.toHaveAttribute('hidden');

  const payloadTab = queryByText('Payload') as Element;
  expect(payloadTab).toBeInTheDocument();
  const payloadContent = document.getElementById('Payload');
  expect(payloadContent).toBeInTheDocument();
  expect(payloadContent).toHaveAttribute('hidden');

  fireEvent.click(payloadTab);
  expect(detailsContent).toHaveAttribute('hidden');
  expect(payloadContent).not.toHaveAttribute('hidden');
});

it('Open snapshot details and click tabs', async () => {
  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <ViewPayloadModal
        open
        isFetching={false}
        adminTask={defaultSnapshotTask}
        setClosed={() => undefined}
      />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText(defaultSnapshotTask.uuid)).toBeInTheDocument();

  const detailsTab = queryByText('Task details');
  expect(detailsTab).toBeInTheDocument();
  const detailsContent = document.getElementById('task-details');
  expect(detailsContent).toBeInTheDocument();
  expect(detailsContent).not.toHaveAttribute('hidden');

  const syncTab = queryByText('Sync') as Element;
  expect(syncTab).toBeInTheDocument();
  const syncContent = document.getElementById('Sync');
  expect(syncContent).toBeInTheDocument();
  expect(syncContent).toHaveAttribute('hidden');

  const distributionTab = queryByText('Distribution') as Element;
  expect(distributionTab).toBeInTheDocument();
  const distributionContent = document.getElementById('Distribution');
  expect(distributionContent).toBeInTheDocument();
  expect(distributionContent).toHaveAttribute('hidden');

  const publicationTab = queryByText('Publication') as Element;
  expect(publicationTab).toBeInTheDocument();
  const publicationContent = document.getElementById('Publication');
  expect(publicationContent).toBeInTheDocument();
  expect(publicationContent).toHaveAttribute('hidden');

  fireEvent.click(distributionTab);
  expect(detailsContent).toHaveAttribute('hidden');
  expect(syncContent).toHaveAttribute('hidden');
  expect(distributionContent).not.toHaveAttribute('hidden');
  expect(publicationContent).toHaveAttribute('hidden');
});

it('Open snapshot task without all pulp tasks', async () => {
  const missingDistribution: AdminTask = {
    ...defaultSnapshotTask,
    payload: {
      ...defaultSnapshotTask.payload,
      distribution: undefined,
    },
  };
  render(
    <ReactQueryTestWrapper>
      <ViewPayloadModal
        open
        isFetching={false}
        adminTask={missingDistribution}
        setClosed={() => undefined}
      />
    </ReactQueryTestWrapper>,
  );

  const modal = document.getElementsByClassName('pf-c-tab-content');
  // Details, sync, publication
  expect(modal).toHaveLength(3);
});
