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


export const randomNumber = (booking_id) => {
	  const currentDate = new Date();
     // return  Math.random().toString(36).slice(2)+'.'+booking_id;
     return  'weclea123aelcew';
}