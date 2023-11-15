export const date=()=> {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
  
    return `${year}-${month}-${day}`;
  }

  export const time = () => {
	const currentDate = new Date();
	const hours = String(currentDate.getHours()).padStart(2, "0");
	const minutes = String(currentDate.getMinutes()).padStart(2, "0");
	const seconds = String(currentDate.getSeconds()).padStart(2, "0");
  
	return `${hours}:${minutes}:${seconds}`;
  };
  

// fetch data response 
export const getDates = (startDate,endDate,frequency, data, res) => {
	const currentDate = new Date(startDate.getTime());
	const dates = [];
	while (currentDate <= endDate) {
		// console.log('frequencyss',frequency)
		dates.push(new Date(currentDate));
		currentDate.setDate(currentDate.getDate() + Number(frequency));
		// console.log(currentDate)
	}
	return dates;
};


// fetch data response 
export const setDateForNotification = (startDate,endDate, data, res) => {
	const currentDate = new Date(startDate.getTime());
	const dates = [];
	var i = 0;
	while (currentDate <= endDate) {
		
		if(i != 0){
			dates.push(new Date(currentDate));
		}
		
		currentDate.setDate(currentDate.getDate() + 1);
		i++;
	}
	return dates;
};


export const randomNumber = (booking_id) => {
	  const currentDate = new Date();
     // return  Math.random().toString(36).slice(2)+'.'+booking_id;
     return  '1001'+booking_id;
}

export const randomNumberDryClean = (booking_id) => {
	  const currentDate = new Date();
     // return  Math.random().toString(36).slice(2)+'.'+booking_id;
     return  '1001'+booking_id;
}


export const isToday = (date) => {
	const today = new Date();
	const formattedToday = today.toISOString().split('T')[0]; 
	return date === formattedToday;
  }
  

  export const isThisWeek = (date) => {
	const today = new Date();
	const currentWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
	const formattedCurrentWeekStart = currentWeekStart.toISOString().split('T')[0];
	const nextWeekStart = new Date(currentWeekStart);
	nextWeekStart.setDate(nextWeekStart.getDate() + 7);
	const formattedNextWeekStart = nextWeekStart.toISOString().split('T')[0];
	return date >= formattedCurrentWeekStart && date < formattedNextWeekStart;
  }
  
  export const isThisMonth = (date) => {
	const today = new Date();
	const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
	const formattedCurrentMonthStart = currentMonthStart.toISOString().split('T')[0];
	const nextMonthStart = new Date(currentMonthStart);
	nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
	const formattedNextMonthStart = nextMonthStart.toISOString().split('T')[0];
	return date >= formattedCurrentMonthStart && date < formattedNextMonthStart;
  }
  