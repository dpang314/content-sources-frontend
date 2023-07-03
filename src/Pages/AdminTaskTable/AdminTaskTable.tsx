import {
  Bullseye,
  Button,
  Flex,
  FlexItem,
  Grid,
  OnPerPageSelect,
  OnSetPage,
  Pagination,
  PaginationVariant,
  Spinner,
} from '@patternfly/react-core';
import {
  TableComposable,
  TableVariant,
  Tbody,
  Td,
  Th,
  Thead,
  ThProps,
  Tr,
} from '@patternfly/react-table';
import { global_BackgroundColor_100 } from '@patternfly/react-tokens';
import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { SkeletonTable } from '@redhat-cloud-services/frontend-components';
import Hide from '../../components/Hide/Hide';
import EmptyTableState from '../../components/EmptyTableState/EmptyTableState';
import AdminTaskFilters from './components/AdminTaskFilters';
import ViewPayloadModal from './components/ViewPayloadModal/ViewPayloadModal';
import dayjs from 'dayjs';
import StatusIcon from './components/StatusIcon';
import {
  useAdminTaskListQuery,
  useFetchAdminTaskQuery,
} from '../../services/AdminTasks/AdminTaskQueries';
import { AdminTaskFilterData, AdminTask } from '../../services/AdminTasks/AdminTaskApi';

const useStyles = createUseStyles({
  mainContainer: {
    backgroundColor: global_BackgroundColor_100.value,
    display: 'flex',
    flexDirection: 'column',
  },
  mainContainer100Height: {
    composes: ['$mainContainer'], // This extends another class within this stylesheet
    minHeight: '100%',
  },
  topContainer: {
    justifyContent: 'space-between',
    padding: '16px 24px', // This is needed
    height: 'fit-content',
  },
  bottomContainer: {
    justifyContent: 'space-between',
    height: 'fit-content',
  },
  invisible: {
    opacity: 0,
  },
});

export const formatDate = (date: string): string => dayjs(date).format('DD MMM YYYY HH:mm UTCZ');

const AdminTaskTable = () => {
  const classes = useStyles();
  const storedPerPage = Number(localStorage.getItem('perPage')) || 20;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(storedPerPage);
  const [activeSortIndex, setActiveSortIndex] = useState<number>(3); // queued_at
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc'>('desc');
  const [payloadOpen, setPayloadOpen] = useState(false);
  const { fetchAdminTask, isLoading: isFetchingAdminTask } = useFetchAdminTaskQuery();
  const [adminTask, setAdminTask] = useState<AdminTask | null>(null);

  const [filterData, setFilterData] = useState<AdminTaskFilterData>({
    accountId: '',
    orgId: '',
    statuses: [],
  });

  const clearFilters = () => setFilterData({ statuses: [], accountId: '', orgId: '' });

  const notFiltered =
    filterData.statuses.length === 0 && filterData.accountId === '' && filterData.orgId === '';

  const columnSortAttributes = [
    'org_id',
    'account_id',
    'typename',
    'queued_at',
    'started_at',
    'finished_at',
    'status',
  ];

  const sortString = (): string =>
    columnSortAttributes[activeSortIndex] + ':' + activeSortDirection;

  const {
    isLoading,
    error,
    isError,
    isFetching,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = useAdminTaskListQuery(page, perPage, filterData, sortString());

  const actionTakingPlace = isFetching;

  const onSetPage: OnSetPage = (_, newPage) => setPage(newPage);

  const onPerPageSelect: OnPerPageSelect = (_, newPerPage, newPage) => {
    // Save this value through page refresh for use on next reload
    localStorage.setItem('perPage', newPerPage.toString());
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const sortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex,
  });

  const columnHeaders = ['Org ID', 'Account ID', 'Type', 'Queued At', 'Status'];

  // Error is caught in the wrapper component
  if (isError) throw error;

  const {
    data: adminTaskList = [],
    meta: { count = 0 },
  } = data;

  const itemName = 'tasks';

  const countIsZero = count === 0;

  if (countIsZero && notFiltered && !isLoading)
    return (
      <Bullseye data-ouia-safe={!actionTakingPlace} data-ouia-component-id='admin_task_list_page'>
        <EmptyTableState
          notFiltered={notFiltered}
          clearFilters={clearFilters}
          itemName={itemName}
        />
      </Bullseye>
    );

  return (
    <Grid
      data-ouia-safe={!actionTakingPlace}
      data-ouia-component-id='admin_task_list_page'
      className={countIsZero ? classes.mainContainer100Height : classes.mainContainer}
    >
      <ViewPayloadModal
        setClosed={() => {
          setAdminTask(null);
          setPayloadOpen(false);
        }}
        isFetching={isFetchingAdminTask}
        open={payloadOpen}
        adminTask={adminTask}
      />
      <Flex className={classes.topContainer}>
        <AdminTaskFilters
          isLoading={isLoading}
          setFilterData={(values) => {
            setFilterData(values);
            setPage(1);
          }}
          filterData={filterData}
        />
        <FlexItem>
          <Hide hide={countIsZero}>
            <Pagination
              id='top-pagination-id'
              widgetId='topPaginationWidgetId'
              perPageComponent='button'
              isDisabled={isLoading}
              itemCount={count}
              perPage={perPage}
              page={page}
              onSetPage={onSetPage}
              isCompact
              onPerPageSelect={onPerPageSelect}
            />
          </Hide>
        </FlexItem>
      </Flex>
      <Hide hide={!isLoading}>
        <Grid className={classes.mainContainer}>
          <SkeletonTable
            rowSize={perPage}
            colSize={columnHeaders.length}
            variant={TableVariant.compact}
          />
        </Grid>
      </Hide>
      <Hide hide={countIsZero || isLoading}>
        <>
          <TableComposable
            aria-label='Admin tasks table'
            ouiaId='admin_tasks_table'
            variant='compact'
          >
            <Thead>
              <Tr>
                {columnHeaders.map((columnHeader, index) => (
                  <Th key={columnHeader + 'column'} sort={sortParams(index)}>
                    {columnHeader}
                  </Th>
                ))}
                <Th>
                  <Spinner size='md' className={actionTakingPlace ? '' : classes.invisible} />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {adminTaskList.map(
                ({ uuid, account_id, org_id, status, queued_at, typename }: AdminTask) => (
                  <Tr key={uuid}>
                    <Td>{org_id}</Td>
                    <Td>{account_id ? account_id : 'Unknown'}</Td>
                    <Td>{typename}</Td>
                    <Td>{formatDate(queued_at)}</Td>
                    <Td>
                      <StatusIcon status={status} />
                    </Td>
                    <Td width={10}>
                      <Button
                        onClick={async () => {
                          setPayloadOpen(true);
                          const adminTask = await fetchAdminTask(uuid);
                          setAdminTask(adminTask);
                        }}
                        variant='secondary'
                        ouiaId='view_task_details'
                      >
                        View Details
                      </Button>
                    </Td>
                  </Tr>
                ),
              )}
            </Tbody>
          </TableComposable>
          <Flex className={classes.bottomContainer}>
            <FlexItem />
            <FlexItem>
              <Pagination
                id='bottom-pagination-id'
                widgetId='bottomPaginationWidgetId'
                perPageComponent='button'
                itemCount={count}
                perPage={perPage}
                page={page}
                onSetPage={onSetPage}
                variant={PaginationVariant.bottom}
                onPerPageSelect={onPerPageSelect}
              />
            </FlexItem>
          </Flex>
        </>
      </Hide>
      <Hide hide={!countIsZero || isLoading}>
        <EmptyTableState
          notFiltered={notFiltered}
          clearFilters={clearFilters}
          itemName={itemName}
        />
      </Hide>
    </Grid>
  );
};

export default AdminTaskTable;