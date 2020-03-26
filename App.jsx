("use strict");

const e = React.createElement;

class App extends React.Component {
  constructor(props) {
    super(props);
    // this.state = { tableData: watchGPS() };
  }

  render() {
    return e("p");
  }
}
const domContainer = document.querySelector("#table");
ReactDOM.render(e(App), domContainer);
