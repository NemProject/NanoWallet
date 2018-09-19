import nem from 'nem-sdk';
import Helpers from '../../utils/helpers';
import jsQR from "jsqr";

class importWalletQrCodeCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Alert, Wallet, $timeout, $localStorage, WalletBuilder, $state, $scope) {
        'ngInject';

        //// Module dependencies region ////
        this._$state = $state;
        this._Wallet = Wallet;
        this._Alert = Alert;
        this._$timeout = $timeout;
        this._WalletBuilder = WalletBuilder;
        this._storage = $localStorage;

        this.qrcodeWallet = {};
        this.common = nem.model.objects.get("common");
        this.walletName = '';
        this.scanStarted = false;

        this.init();

        // Will stop scan if user change page
        $scope.$on("$destroy", () => {
            this.stopScan();
        });
    }

    init() {
        this.adduploadQrcodeListener()
    }

    stopScan() {
      if (this.scanStarted) {
        this.scanStarted = false;
        clearInterval(this.continueDetectInterval); //clear interval
        this.openedVideoStream.getTracks()[0].stop(); //stop stream
        this.video.pause(); // video pause;
        $("#scanQrcode").html(""); //delete #camera content
      }
    }

    /**
     * read qrcode
     */  
    tick() {
        let self = this;
        if (self.video.readyState === self.video.HAVE_ENOUGH_DATA) {
          self.canvasElement.height = self.video.videoHeight;
          self.canvasElement.width = self.video.videoWidth;

          self.canvas.drawImage(self.video, 0, 0, self.canvasElement.width, self.canvasElement.height);
          var imageData = self.canvas.getImageData(0, 0, self.canvasElement.width, self.canvasElement.height);
          var code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            try {
              let wallet = JSON.parse(code.data)
              console.log('success detect QR, close camera!');

              if(wallet && wallet.data && wallet.data.name){
                  
                  this.stopScan();

                  $("#importWalletName").text(wallet.data.name);
                  self.qrcodeWallet = wallet;
                  $('#importQrcodeModal').modal('show');
              }else{
                console.log('Detect qr, but not NEM qr. continue ...')
              }
            } catch (err) {
              console.log('continue to detect Qrcode...')
            }
          }
        }
    }


    /**
     * search qrcode in video realtime.
     */
    continueDetectQR () {
        let self = this;
        self.continueDetectInterval = setInterval(()=>{
            self.tick()
        }, 1000/60)
    }

    /**
     * scan qrcode image
     */
    scan() {
        this.scanStarted = true;
        let self = this;
        let cvsElement = document.createElement('canvas');
        cvsElement.id = "scanQrcodeCvs";
        cvsElement.hidden = true;

        let videoElement = document.createElement('video');
        videoElement.style.width = "500px";

        $('#scanQrcode').append(cvsElement);
        $('#scanQrcode').append(videoElement);

        this.video = document.getElementsByTagName('video')[0];
        this.canvasElement = document.getElementById("scanQrcodeCvs");
        this.canvas = this.canvasElement.getContext("2d");

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
          self.video.srcObject = stream;
          self.openedVideoStream = stream;
          self.video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
          self.video.play();
          self.continueDetectQR();
        });
    }    

    /**
     * upload qrcode image
     */  

    drawToCanvasAndReadQR(imgData) {
            let self = this;
            var cvs = document.getElementById('uploadQrcodeCvs');
            var ctx = cvs.getContext('2d');
            var img = new Image;
            img.src = imgData;

            img.onload = function(){//必须onload之后再画
                console.log('img W x H', img.naturalWidth, img.naturalHeight)
                cvs.width = img.naturalWidth
                cvs.height = img.naturalHeight
     
                ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
                var imgageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
                var code = jsQR(imgageData.data, imgageData.width, imgageData.height);
                
                try {
                  let wallet = JSON.parse(code.data)
                  if(wallet && wallet.data && wallet.data.name){
                      self.qrcodeWallet = wallet;
                      $("#importWalletName").text(wallet.data.name);
                      $('#importQrcodeModal').modal('show');
                  }else{
                    console.log('->Detect qr, but not NEM qr. continue ...')
                  }
                } catch (err) {
                  console.log('non json qr...')
                }                
            }     
        }

    adduploadQrcodeListener() {
        let self = this;
        document.getElementById('uploadQrcodeInput').addEventListener('change', function() {
          var file = this.files[0];//获取input输入的图片
          if(!/image\/\w+/.test(file.type)){
              alert("请确保文件为图像类型");
              return false;
          }//判断是否图片，在移动端由于浏览器对调用file类型处理不同，虽然加了accept = 'image/*'，但是还要再次判断
          var reader = new FileReader();
          reader.readAsDataURL(file);//转化成base64数据类型
          reader.onload = function(e){
            self.drawToCanvasAndReadQR(this.result);
          }
        });

    }

    importQrcodeWallet() {
        if(!this.common.password || !this.qrcodeWallet.data) {
          return
        }
        let truePassword = this.common.password
        if(this.qrcodeWallet.wxwallet && this.qrcodeWallet.wxwallet == "1") {
            truePassword = nem.crypto.helpers.derivePassSha(this.common.password, 6000).priv;
            console.log('found nem wechat wallet qrcode')
        }

        let encrypted = this.qrcodeWallet.data.priv_key;
        let salt = nem.crypto.js.enc.Hex.parse(this.qrcodeWallet.data.salt);
        let key = nem.crypto.js.PBKDF2(truePassword, salt, {
          keySize: 256 / 32,
          iterations: 2000
        })

        let iv = encrypted.substring(0, 32);
        let encryptedKey =  encrypted.substring(32,128);

        let obj = {
          ciphertext: nem.crypto.js.enc.Hex.parse(encryptedKey),
          iv: nem.utils.convert.hex2ua(iv),
          key: nem.utils.convert.hex2ua(key.toString())
        }      
        let priv = nem.crypto.helpers.decrypt(obj);
        if(priv.length === 64 || priv.length === 66) {

          this._WalletBuilder.createPrivateKeyWallet(this.qrcodeWallet.data.name + '.', this.common.password, priv, 104).then((wlt) => {
              this._$timeout(() => {
                  if (wlt && typeof wlt === 'object') {
                      this._storage.wallets = this._storage.wallets.concat(wlt);
                      this._Alert.createWalletSuccess();
                      //delete paddword and wallet
                      this.common.password = "";
                      this.qrcodeWallet = {};

                      $('#importQrcodeModal').modal('hide');

                      this._$state.go("app.login");
                  }
              }, 10);
          },
          (err) => {
              console.log('..._WalletBuilder.createPrivateKeyWallet err');
          });    
        }else{
          this._Alert.passwordsNotMatching();
        }
    }


    //// End methods region ////

}

export default importWalletQrCodeCtrl;