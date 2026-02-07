import moment from 'moment';

export const formatDate = (date: string | Date): string => {
  return moment(date).format('YYYY-MM-DD');
};

export const formatDateTime = (date: string | Date): string => {
  return moment(date).format('YYYY-MM-DD HH:mm');
};

export const formatTime = (date: string | Date): string => {
  return moment(date).format('hh:mm A');
};

export const getPeriodDates = (period: string): { startDate: string; endDate: string } => {
  const now = moment();
  let startDate: moment.Moment;
  let endDate: moment.Moment;

  switch (period) {
    case 'thisMonth':
      startDate = now.clone().startOf('month');
      endDate = now.clone().endOf('month');
      break;
    case 'lastMonth':
      startDate = now.clone().subtract(1, 'month').startOf('month');
      endDate = now.clone().subtract(1, 'month').endOf('month');
      break;
    case 'thisQuarter':
      startDate = now.clone().startOf('quarter');
      endDate = now.clone().endOf('quarter');
      break;
    case 'lastQuarter':
      startDate = now.clone().subtract(1, 'quarter').startOf('quarter');
      endDate = now.clone().subtract(1, 'quarter').endOf('quarter');
      break;
    case 'Q1':
      startDate = moment(`${now.year()}-01-01`);
      endDate = moment(`${now.year()}-03-31`);
      break;
    case 'Q2':
      startDate = moment(`${now.year()}-04-01`);
      endDate = moment(`${now.year()}-06-30`);
      break;
    case 'Q3':
      startDate = moment(`${now.year()}-07-01`);
      endDate = moment(`${now.year()}-09-30`);
      break;
    case 'Q4':
      startDate = moment(`${now.year()}-10-01`);
      endDate = moment(`${now.year()}-12-31`);
      break;
    case 'january':
      startDate = moment(`${now.year()}-01-01`);
      endDate = moment(`${now.year()}-01-31`);
      break;
    case 'february':
      startDate = moment(`${now.year()}-02-01`);
      endDate = moment(`${now.year()}-02-28`);
      break;
    case 'march':
      startDate = moment(`${now.year()}-03-01`);
      endDate = moment(`${now.year()}-03-31`);
      break;
    case 'april':
      startDate = moment(`${now.year()}-04-01`);
      endDate = moment(`${now.year()}-04-30`);
      break;
    case 'may':
      startDate = moment(`${now.year()}-05-01`);
      endDate = moment(`${now.year()}-05-31`);
      break;
    case 'june':
      startDate = moment(`${now.year()}-06-01`);
      endDate = moment(`${now.year()}-06-30`);
      break;
    case 'july':
      startDate = moment(`${now.year()}-07-01`);
      endDate = moment(`${now.year()}-07-31`);
      break;
    case 'august':
      startDate = moment(`${now.year()}-08-01`);
      endDate = moment(`${now.year()}-08-31`);
      break;
    case 'september':
      startDate = moment(`${now.year()}-09-01`);
      endDate = moment(`${now.year()}-09-30`);
      break;
    case 'october':
      startDate = moment(`${now.year()}-10-01`);
      endDate = moment(`${now.year()}-10-31`);
      break;
    case 'november':
      startDate = moment(`${now.year()}-11-01`);
      endDate = moment(`${now.year()}-11-30`);
      break;
    case 'december':
      startDate = moment(`${now.year()}-12-01`);
      endDate = moment(`${now.year()}-12-31`);
      break;
    default:
      startDate = now.clone().startOf('month');
      endDate = now.clone().endOf('month');
  }

  return {
    startDate: startDate.format('YYYY-MM-DD'),
    endDate: endDate.format('YYYY-MM-DD'),
  };
};

export const getTodayDate = (): string => {
  return moment().format('YYYY-MM-DD');
};

export const getCurrentTime = (): string => {
  return moment().format('hh:mm:ss A');
};