function dateForecast(convertedDate) {

    const chosenDate = convertedDate

    let [day1, month1, year1] = [chosenDate.split('-')[0], chosenDate.split('-')[1], chosenDate.split('-')[2]]
    let [day1_num, month1_num, year1_num] = [parseInt(day1), parseInt(month1), parseInt(year1)]

    let month;
    if (year1_num % 4 !== 0) {
        month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        month = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    }

    let day2_num = day1_num + 14
    let month2_num = month1_num
    let year2_num = year1_num

    // verifica se o dia da 2 entrega não ultrapassa a quantidade de dias do mês.
    if (day2_num > month[month1_num - 1]) {
        day2_num = day2_num - (month[month1_num - 1])
        month2_num = month1_num + 1
    }
    // verifica se o mês da 2 entrega não passa de 12.
    if (month2_num > 12) {
        month2_num = 1
        year2_num = year2_num + 1
    }

    let day3_num = day2_num + 14
    let month3_num = month2_num
    let year3_num = year2_num

    // verifica se o dia da 3 entrega não ultrapassa a quantidade de dias do mês.
    if (day3_num > month[month2_num - 1]) {
        day3_num = day3_num - (month[month2_num - 1])
        month3_num = month2_num + 1
    }

    // verifica se o mês da 3 entrega não passa de 12.
    if (month3_num > 12) {
        month3_num = 1
        year3_num = year3_num + 1
    }

    const formatedDate1 = `${convertToString(day1_num)}-${convertToString(month1_num)}-${convertToString(year1_num)}`
    const formatedDate2 = `${convertToString(day2_num)}-${convertToString(month2_num)}-${convertToString(year2_num)}`
    const formatedDate3 = `${convertToString(day3_num)}-${convertToString(month3_num)}-${convertToString(year3_num)}`

    function convertToString(num) {
        const strNum = num.toString()
        if (strNum.length == 1) {
            return `0${strNum}`
        } else {
            return strNum
        }
    }

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

    var weekdayForm = new Date(months[parseInt(month1_num - 1)] + " " + day1_num + ", " + year1_num)
    var weekday = days[weekdayForm.getDay()];

    return {
        formatedDate1,
        formatedDate2,
        formatedDate3,
        weekday
    }
}
module.exports = dateForecast