export const date=()=> {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
  
    return `${year}-${month}-${day}`;
  }

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