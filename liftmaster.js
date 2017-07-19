// UPDATED VERSION OF https://github.com/chadsmith/node-liftmaster

const request = require('request-promise-native');

class MyQ {
  constructor(username, password) {
    this.userAgent = 'Chamberlain/3.73';
    this.brandId = '2';
    this.apiVersion = '4.1';
    this.culture = "en";
    this.endpoint = 'https://myqexternal.myqdevice.com';
    this.appId = 'NWknvuBd7LoFHfXmKNMBcgajXtZEgKUh4V7WNzMidrpUUluDpVYVZx+xT4PCM5Kx';
    this.username = username;
    this.password = password;
  };

  login() {
    return request({
      method: 'POST',
      uri: this.endpoint + '/api/v4/User/Validate',
      headers: {
        "User-Agent": this.userAgent,
        BrandId: this.brandId,
        ApiVersion: this.apiVersion,
        Culture: this.culture,
        MyQApplicationId: this.appId
      },
      body: {
        username: this.username,
        password: this.password
      },
      json: true
    }).then((res) => {
      this.securityToken = res.SecurityToken;
      return res;
    }).catch((err) => {
      return err;
    });
  };

  getDevices() {
    return request({
      method: 'GET',
      uri: this.endpoint + '/api/UserDeviceDetails',
      qs: {
        appId: this.appId,
        securityToken: this.securityToken,
        filterOn: true
      },
      json: true
    }).then((res) => {
      this.devices = [];
      body.Devices.forEach((Device, device) => {
        if (Device.MyQDeviceTypeId != 2) {
          return;
        }
        device = {
          id: Device.DeviceId
        };
        Device.Attributes.forEach((attribute) => {
          if (attribute.Name == 'desc') {
            device.name = attribute.Value;
          }
          if (attribute.Name == 'doorstate') {
            device.state = attribute.Value;
            device.updated = attribute.UpdatedTime;
          }
        });
        this.devices.push(device);
      });
      return this.devices;
    }).catch((err) => {
      return err;
    });
  };

  getDoorState(deviceId) {
    return request({
      method: 'GET',
      uri: this.endpoint + '/Device/getDeviceAttribute',
      qs: {
        appId: this.appId,
        securityToken: this.securityToken,
        devId: deviceId,
        name: 'doorstate'
      },
      json: true
    }).then((res) => {
      this.devices.forEach((device) => {
        if (device.id === deviceId) {
          device.state = body.AttributeValue;
          device.updated = body.UpdatedTime;
          return device;
        }
      });
    }).catch((err) => {
      return err;
    });
  };

  setDoorState(deviceId, state) {
    return request({
      method: 'PUT',
      uri: this.endpoint + '/Device/setDeviceAttribute',
      body: {
        DeviceId: deviceId,
        ApplicationId: this.appId,
        AttributeName: 'desireddoorstate',
        AttributeValue: state,
        securityToken: this.securityToken
      },
      json: true
    }).then((res) => {
      setTimeout(() => {
        return this._loopDoorState(deviceId);
      }, 1000);
    }).catch((err) => {
      return err;
    });
  };

  _loopDoorState(deviceId) {
    return this.getDoorState(deviceId)
      .then((res) => {
        if (res.state == 4 || res.state == 5) {
          setTimeout(() => {
            return this._loopDoorState(deviceId)
          }, 5000);
        } else {
          return res;
        }
      }).catch((err) => {
        return err;
      });
  };
};

module.exports = MyQ;
