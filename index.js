import './style'
import 'preact/debug'
import { Component } from 'preact'
import myState from './state.js'
import rooms from './rooms'

const apiVer = 3

const remote =
  process.env.NODE_ENV === 'production'
    ? 'https://nhatroconhuong.com/v' + apiVer + '/nhatro'
    : 'http://' + location.hostname + ':5000/v' + apiVer + '/nhatro'
// const remote ='https://nhatroconhuong.com/v' + apiVer + '/nhatro'

if (process.env.NODE_ENV !== 'production') myState.pass = '123Bistqt'

export default class App extends Component {
  state = myState

  componentDidMount() {
    let localState = localStorage.getItem('localState')
    localState = JSON.parse(localState)
    if (localState && localState.token) {
      this.setState({ loading: true, notice: 'Đang cập nhật dữ liệu...' })
      const DATE = new Date()
      let MONTH = DATE.getMonth()
      if (MONTH === 0) MONTH = 12
      const DAY = DATE.getDate()
      this.setState(
        _prevState => {
          return {
            token: localState.token,
            datas: localState.datas,
            room: localState.room,
            user: localState.user,
            ver: localState.ver,
          }
        },
        () => {
          if (localState.datas[0].month === MONTH && !localState.datas[0].thanhtoan) this.fetchData('sync')
          else if (localState.datas[0].month !== MONTH && DAY > 4) this.fetchData('new')
          else this.fetchData('checkAuth')
        },
      )
    }
  }

  handleErr = e => {
    console.log(e)
    this.setState({
      loading: false,
      notice: `Có lỗi, thử lại hoặc chụp màn hình gửi lỗi: ${e.name}: ${e.message}`,
    })
  }

  handleErrRes = res => {
    console.log(res)
    this.setState({ confirm: false, loading: false })
    if (res.status === 405) this.setState({ notice: 'Sai Mật khẩu' })
    else if (res.status === 406 || res.status === 444) {
      res.text().then(txt => {
        console.log(txt)
        this.setState({
          datas: [],
          user: '',
          token: '',
          room: '',
          ver: '',
          notice:
            res.status === 444 ? `Ver ${this.state.ver} đã cũ, REFRESH lại để update. Ver đúng là ${txt}` : 'Từ chối đăng nhập',
        })
        this.logout()
      })
    } else this.setState({ notice: 'Không có dữ liệu' })
  }

  checkAndSaveLocal = (tongcong, dienkytruoc, nuockytruoc) => {
    const _data = JSON.stringify({
      token: this.state.token,
      datas: this.state.datas,
      room: this.state.room,
      user: this.state.user,
      ver: this.state.ver,
    })
    localStorage.setItem('localState', _data)
    if (!tongcong) this.setState({ dien: dienkytruoc, nuoc: nuockytruoc })
  }

  fetchData = (req, dien, nuoc) => {
    const body = JSON.stringify({
      room: this.state.room,
      pass: this.state.pass,
      token: this.state.token,
      ver: this.state.ver,
      req: req,
      dien: dien,
      nuoc: nuoc,
    })
    this.setState({ loading: true, notice: 'Đang lấy dữ liệu...' })
    console.log(body)
    fetch(remote, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    })
      .then(res => {
        if (res.status === 200) res.json().then(json => this.handleRes(req, json, res.headers.get('Content-Language')))
        else this.handleErrRes(res)
      })
      .catch(e => this.handleErr(e))
  }

  handleRes = (req, json, sv) => {
    console.log('req', req)
    console.log('json', json)
    console.log('sv', sv)
    this.setState({ sv: sv })
    let newDatas
    switch (req) {
      case 'checkAuth':
        break
      case 'login':
        this.setState(
          _prevState => {
            return {
              token: json.token,
              datas: json.datas,
              user: json.datas[0].users[0].name,
              loading: false,
              notice: '',
            }
          },
          () => this.checkAndSaveLocal(json.datas[0].tongcong, json.datas[0].dien.sokytruoc, json.datas[0].nuoc.sokytruoc),
        )
        break
      default:
        newDatas = this.state.datas.slice(0)
        newDatas[0] = json
        this.setState(
          _prevState => {
            return {
              datas: newDatas,
              confirm: false,
              loading: false,
              notice: '',
            }
          },
          () => this.checkAndSaveLocal(json.tongcong, json.dien.sokytruoc, json.nuoc.sokytruoc),
        )
    }
  }

  btnClick = event => {
    event.preventDefault()
    switch (event.target.name) {
      case 'login':
        this.fetchData('login')
        break
      case 'submit':
        this.setState({ confirm: true })
        break
      case 'reset':
        // this.fetchData('reset')
        this.reset()
        break
      case 'ok':
        this.fetchData('update', this.state.dien, this.state.nuoc)
        break
      case 'cancel':
        this.setState({ confirm: false })
        break
      case 'rscancel':
        this.rscancel()
        break
    }
  }

  loginValidate = () => this.state.room && this.state.pass && this.state.loginValid

  dnValidate = () => this.state.dienValid && this.state.nuocValid

  keyUpEv = event => {
    if (!this.state.loading) {
      switch (event.key) {
        case 'Enter':
          switch (event.target.name) {
            case 'room':
            case 'pass':
              if (this.loginValidate()) this.fetchData('login')
              break
            case 'dien':
            case 'nuoc':
              if (this.dnValidate()) this.setState({ confirm: true })
          }
      }
    }
  }

  renderInput = (label, type, name, placeholder, reverse) => {
    return (
      <div class="flex align-items-end">
        <label className={'flex-' + (reverse ? '60' : '40')} for={name}>
          {label}
        </label>
        <div className={'flex-' + (reverse ? '40' : '60')}>
          <input
            type={type}
            name={name}
            value={this.state[name]}
            placeholder={placeholder}
            onInput={this.onInput}
            onKeyUp={this.keyUpEv}
          />
        </div>
      </div>
    )
  }

  onInput = event => {
    const name = event.target.name
    const value = event.target.value
    switch (name) {
      case 'room':
        this.roomOnInput(value)
        break
      case 'dien':
      case 'nuoc':
        this.dnInput(name, value)
        break
      default:
        this.setState({ [name]: value })
    }
  }

  roomOnInput = value => {
    if (rooms.indexOf(value) < 0) this.setState({ room: value, notice: 'Số phòng sai', loginValid: false })
    else this.setState({ room: value, notice: '', loginValid: true })
  }

  dnInput = (name, value) => {
    const kynay = Number(value)
    const kytruoc = this.state.datas[1][name].sokynay
    const valid = name + 'Valid'
    if (kynay - kytruoc < 1)
      this.setState({
        [name]: kynay,
        notice: 'Số mới phải lớn hơn số kỳ trước',
        [valid]: false,
      })
    else this.setState({ [name]: kynay, notice: '', [valid]: true })
  }

  show = () => {
    const value = !this.state.showOlderBills
    this.setState({ showOlderBills: value })
  }

  reset = () => {
    const temp = JSON.stringify(this.state.datas[0])
    const datas = this.state.datas.slice(0)
    datas[0].tongcong = 0
    datas[0].dien.sokynay = 0
    datas[0].dien.tieuthu = 0
    datas[0].dien.thanhtien = 0
    datas[0].nuoc.sokynay = 0
    datas[0].nuoc.tieuthu = 0
    datas[0].nuoc.thanhtien = 0
    this.setState({
      datas: datas,
      dien: datas[0].dien.sokytruoc,
      nuoc: datas[0].nuoc.sokytruoc,
      temp: temp,
    })
  }

  rscancel = () => {
    const datas = this.state.datas.slice(0)
    datas[0] = JSON.parse(this.state.temp)
    this.setState({
      datas: datas,
      temp: '',
    })
  }

  renderInputField = () => {
    if (this.state.datas[0].tongcong < 1) {
      return (
        <div>
          <h3>
            {' '}
            Nhập số điện,
            <br />
            số nước mới!!!{' '}
          </h3>
          <div class="flex col">
            {this.renderInput('NHẬP SỐ ĐIỆN:', 'number', 'dien', 'Số điện', true)}
            {this.renderInput('NHẬP SỐ NƯỚC:', 'number', 'nuoc', 'Số nước', true)}
          </div>
          <div className={this.state.notice ? 'notice' : 'hidden'}>{this.state.notice}</div>
          <button name="submit" onClick={this.btnClick} disabled={!this.dnValidate() || this.state.loading}>
            XÁC NHẬN
          </button>
          {this.renderResetCancelButton()}
        </div>
      )
    }
  }

  renderResetCancelButton = () => {
    if (this.state.temp) {
      return (
        <button name="rscancel" onClick={this.btnClick}>
          KHÔNG ĐỔI NỮA!!
        </button>
      )
    }
  }

  renderButtons = idx => {
    if (idx === 0) {
      return (
        <div>
          {this.renderResetButton()}
          {this.renderShowOlderBillsButton()}
          {this.renderLogoutButton()}
        </div>
      )
    }
  }

  renderShowOlderBillsButton = () => {
    if (this.state.datas.length > 2) {
      return (
        <button name="showOlderBills" onClick={this.show}>
          {this.state.showOlderBills ? 'ẨN BILLS CŨ' : 'HIỆN BILLS CŨ'}
        </button>
      )
    }
  }

  renderResetButton = () => {
    if (this.state.datas[0].tongcong && !this.state.datas[0].thanhtoan) {
      return (
        <button name="reset" onClick={this.btnClick} disabled={3 - this.state.datas[0].update < 1}>
          NHẬP LẠI (CÒN {3 - this.state.datas[0].update} LẦN)
        </button>
      )
    }
  }

  renderLogoutButton = () => {
    return (
      <button name="logout" onClick={this.logout}>
        LOGOUT
      </button>
    )
  }

  renderLoading = () => {
    return (
      <div class="app">
        <div className={this.state.notice ? 'notice' : 'hidden'}>{this.state.notice}</div>
        <div className={this.state.loading ? 'spinner' : 'hidden'} style="width: 100%;">
          <div class="bounce1" />
          <div class="bounce2" />
          <div class="bounce3" />
        </div>
      </div>
    )
  }

  renderOtherFee = fee => {
    if (fee && fee.tien)
      return (
        <div>
          <div>{fee.khoan || 'Khác'}</div>
          <div>{fee.tien.toLocaleString('vi')}</div>
        </div>
      )
  }

  renderMorePeople = themNguoi => {
    if (themNguoi && themNguoi.tongTien)
      return (
        <div>
          <div>Thêm {themNguoi.soNguoi} người</div>
          <div>{themNguoi.tongTien.toLocaleString('vi')} </div>
        </div>
      )
  }

  logout = () => {
    localStorage.removeItem('localState')
    const tempState = { ...{}, ...myState }
    tempState.notice = this.state.notice
    console.log(tempState)
    this.setState(tempState)
    if ('serviceWorker' in navigator) {
      if (!window.caches) return
      caches
        .keys()
        .then(cs => cs.forEach(c => caches.delete(c)))
        .catch(e => this.handleErr(e))
    }
  }

  renderLogin = () => {
    return (
      <div>
        <h2> Hello! </h2>
        <div class="flex col">
          {this.renderInput('SỐ PHÒNG:', 'number', 'room', 'Số phòng')}
          {this.renderInput('MẬT KHẨU:', 'password', 'pass', 'Mật khẩu')}
        </div>
        <button name="login" onClick={this.btnClick} disabled={!this.loginValidate() || this.state.loading}>
          ĐĂNG NHẬP
        </button>
        {this.renderLoading()}
        <fieldset>
          <legend>Lưu ý:</legend>
          <div>
            Ngày 5 -> 8 hàng tháng, người thuê đăng nhập vào bằng tài khoản đã cung cấp theo số phòng, điền số điện, số nước mới
            để ra bill tiền nhà hàng tháng, ngày 9 hoặc 10 cô Nhường sẽ lên thu tiền. Vui lòng chuẩn bị tiền đầy đủ để cô thu, nếu
            không thu được, thì người thuê có trách nhiệm mang tiền đến nhà cô ở Quận 3, hoặc chuyển khoản.
          </div>
        </fieldset>
        <fieldset>
          <legend>Liên hệ:</legend>
          <div>Cần thông tin gì liên hệ Anh Nam</div>
        </fieldset>
      </div>
    )
  }

  renderUserPage = () => {
    const tempDatas = this.state.showOlderBills ? this.state.datas : this.state.datas.slice(0, 2)
    const needNewData = tempDatas[0].tongcong < 1
    return (
      <div>
        <h2>
          Hello {this.state.user}
          <br />
          phòng {this.state.room}!
        </h2>
        {this.renderInputField()}
        <div className={this.state.confirm ? 'dialog' : 'hidden'}>
          <h2>
            "OK" để xác nhận
            <br />
            "HỦY" để nhập lại
          </h2>
          <h2 class="text-left">
            Số Điện: {this.state.dien}
            <br />
            Số Nước: {this.state.nuoc}
          </h2>
          <button name="ok" class="large" onClick={this.btnClick}>
            OK
          </button>
          <button name="cancel" class="large" onClick={this.btnClick}>
            HỦY
          </button>
          {this.renderLoading()}
        </div>
        {tempDatas.map((d, idx) => {
          return (
            <div>
              <div key={idx} className={'bill' + (idx || d.thanhtoan ? '' : needNewData ? ' attention' : ' active')}>
                <div class="bill-header">
                  <div>
                    BILL PHÒNG {this.state.room} THÁNG {d.month} - {d.year}
                  </div>
                  <div className={d.at ? 'time' : 'hidden'}>(Bill lập lúc: {new Date(d.at).toLocaleString('vi')})</div>
                </div>
                <div class="table">
                  <div>
                    <div>Tiền</div>
                    <div>Th Này</div>
                    <div>Trước</div>
                    <div>T.Thụ</div>
                    <div>Giá</div>
                    <div>Thành tiền</div>
                  </div>
                  <div>
                    <div>Điện</div>
                    <div>{d.dien.sokynay ? d.dien.sokynay.toLocaleString('vi') : '---'}</div>
                    <div>{d.dien.sokytruoc.toLocaleString('vi')}</div>
                    <div>{d.dien.tieuthu ? d.dien.tieuthu.toLocaleString('vi') : '---'}</div>
                    <div>{d.dien.gia.toLocaleString('vi')}</div>
                    <div>{d.dien.thanhtien ? d.dien.thanhtien.toLocaleString('vi') : '---'}</div>
                  </div>
                  <div>
                    <div>Nước</div>
                    <div>{d.nuoc.sokynay ? d.nuoc.sokynay.toLocaleString('vi') : '---'}</div>
                    <div>{d.nuoc.sokytruoc.toLocaleString('vi')}</div>
                    <div>{d.nuoc.tieuthu ? d.nuoc.tieuthu.toLocaleString('vi') : '---'}</div>
                    <div>{d.nuoc.gia.toLocaleString('vi')}</div>
                    <div>{d.nuoc.thanhtien ? d.nuoc.thanhtien.toLocaleString('vi') : '---'}</div>
                  </div>
                  {this.renderOtherFee({ khoan: 'Cọc', tien: d.deposit })}
                  {this.renderOtherFee(d.khac)}
                  {this.renderOtherFee(d.chi)}
                  <div>
                    <div>Rác</div>
                    <div>{d.rac.toLocaleString('vi')}</div>
                  </div>
                  <div>
                    <div>Nhà</div>
                    <div>{d.nha.toLocaleString('vi')}</div>
                  </div>
                  {this.renderOtherFee({ khoan: 'Giữ chìa khóa', tien: d.giuKhoa })}
                  {this.renderMorePeople(d.themNguoi)}
                  <div>
                    <div class="flex space-between">
                      <div>TỔNG CỘNG</div>
                      <div>{d.tongcong ? d.tongcong.toLocaleString('vi') : '---'}</div>
                    </div>
                    <div class="font-size-haft">
                      {!d.tongcong
                        ? 'CHƯA NHẬP SỐ ĐIỆN NƯỚC MỚI'
                        : d.thanhtoan
                        ? `(ĐÃ THANH TOÁN LÚC: ${new Date(d.thanhtoan).toLocaleString('vi')})`
                        : this.state.needNewData
                        ? '(CHƯA CÓ SỐ ĐIỆN + NƯỚC)'
                        : '(CHƯA THANH TOÁN)'}
                    </div>
                  </div>
                </div>
              </div>
              {this.renderButtons(idx)}
            </div>
          )
        })}
      </div>
    )
  }

  renderMainPage = () => {
    if (this.state.token) return this.renderUserPage()
    else return this.renderLogin()
  }

  render({}, { ver, sv }) {
    return (
      <div>
        {this.renderMainPage()}
        <div class="version">
          client: {ver} - server: {sv}
        </div>
      </div>
    )
  }
}
