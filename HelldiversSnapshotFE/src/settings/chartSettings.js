//const missionItem = ref1.current.toDataURL("image/jpeg");
//saveAs(missionItem, `image${i}.png`);

export const options = {
  indexAxis: 'y',
  maintainAspectRatio: false,
  layout: {
    // padding: {
    //   bottom: 80
    // }
  },
  elements: {
    bar: {
      borderWidth: 2,
    },
  },
  responsive: true,
  scales: {
    x: {
      ticks: {
        display: true,
        stepSize: 10,
      },
      grid: {
        drawBorder: false,
        color: '#aaa', // for the grid lines
        drawTicks: false, // true is default 
        drawOnChartArea: true // true is default 
      },
    },
    y: {
      ticks: {
        display: false,
        font: {
          size: 15
        },
        color: 'white'
      },
      grid: {
        drawBorder: false,
        color: '#aaa', // for the grid lines
        drawTicks: false, // true is default 
        drawOnChartArea: false // true is default 
      },

      beginAtZero: true,
    },
  },
  plugins: {
    title: {
      display: false,
    },
    legend: {
      display: false,
    },
    customCanvasBackgroundColor: {
      color: 'lightGreen',
    },
  },

};
