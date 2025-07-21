const axios = require('axios');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    // İyzico API bilgileri (test ortamı)
    this.apiKey = process.env.IYZIPAY_API_KEY;
    this.secretKey = process.env.IYZIPAY_SECRET_KEY;
    this.baseUrl = process.env.IYZIPAY_BASE_URL || 'https://sandbox-api.iyzipay.com';
    // Production için .env'de değerleri değiştirin
  }

  async processPayment(paymentData) {
    const {
      amount,
      currency = 'TRY',
      cardHolderName,
      cardNumber,
      expireMonth,
      expireYear,
      cvc,
      billingAddress,
      items,
      buyerEmail,
      buyerName,
      buyerId
    } = paymentData;

    try {
      // İyzico ödeme isteği
      const request = {
        locale: 'tr',
        conversationId: this.generateConversationId(),
        price: amount.toString(),
        paidPrice: amount.toString(),
        currency: currency,
        installment: '1',
        basketId: this.generateBasketId(),
        paymentChannel: 'WEB',
        paymentGroup: 'PRODUCT',
        paymentCard: {
          cardHolderName: cardHolderName,
          cardNumber: cardNumber,
          expireMonth: expireMonth,
          expireYear: expireYear,
          cvc: cvc,
          registerCard: '0'
        },
        buyer: {
          id: buyerId,
          name: buyerName,
          surname: buyerName,
          gsmNumber: '+905350000000',
          email: buyerEmail,
          identityNumber: '74300864791',
          lastLoginDate: new Date().toISOString(),
          registrationDate: new Date().toISOString(),
          registrationAddress: billingAddress.address,
          ip: '85.34.78.112',
          city: billingAddress.city,
          country: 'Turkey',
          zipCode: billingAddress.zipCode
        },
        shippingAddress: {
          contactName: buyerName,
          city: billingAddress.city,
          country: 'Turkey',
          address: billingAddress.address,
          zipCode: billingAddress.zipCode
        },
        billingAddress: {
          contactName: buyerName,
          city: billingAddress.city,
          country: 'Turkey',
          address: billingAddress.address,
          zipCode: billingAddress.zipCode
        },
        basketItems: items.map(item => ({
          id: item.id,
          name: item.name,
          category1: 'Genel',
          itemType: 'PHYSICAL',
          price: item.price.toString()
        }))
      };

      const response = await this.makePaymentRequest(request);
      
      return {
        success: response.status === 'success',
        status: response.status,
        paymentId: response.paymentId,
        conversationId: response.conversationId,
        errorCode: response.errorCode,
        errorMessage: response.errorMessage,
        rawResponse: response
      };

    } catch (error) {
      console.error('Ödeme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async makePaymentRequest(request) {
    const url = `${this.baseUrl}/payment/auth`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `IYZWS ${this.apiKey}:${this.generateAuthorizationString(request)}`
    };

    try {
      const response = await axios.post(url, request, { headers });
      return response.data;
    } catch (error) {
      throw new Error(`İyzico API hatası: ${error.message}`);
    }
  }

  generateAuthorizationString(request) {
    const hashStr = 
      this.apiKey +
      request.conversationId +
      request.price +
      request.paidPrice +
      request.currency +
      request.basketId +
      request.paymentChannel +
      request.paymentGroup +
      request.paymentCard.cardHolderName +
      request.paymentCard.cardNumber +
      request.paymentCard.expireMonth +
      request.paymentCard.expireYear +
      request.paymentCard.cvc +
      request.buyer.id +
      request.buyer.name +
      request.buyer.surname +
      request.buyer.email +
      request.buyer.gsmNumber +
      request.buyer.identityNumber +
      request.buyer.lastLoginDate +
      request.buyer.registrationDate +
      request.buyer.registrationAddress +
      request.buyer.ip +
      request.buyer.city +
      request.buyer.country +
      request.buyer.zipCode +
      request.shippingAddress.contactName +
      request.shippingAddress.city +
      request.shippingAddress.country +
      request.shippingAddress.address +
      request.shippingAddress.zipCode +
      request.billingAddress.contactName +
      request.billingAddress.city +
      request.billingAddress.country +
      request.billingAddress.address +
      request.billingAddress.zipCode +
      request.basketItems.map(item => 
        item.id + item.name + item.category1 + item.itemType + item.price
      ).join('');

    return crypto.createHmac('sha1', this.secretKey).update(hashStr).digest('base64');
  }

  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateBasketId() {
    return `basket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lisans ödeme işlemi
  async processLicensePayment(licenseData) {
    const {
      licenseType,
      amount,
      buyerEmail,
      buyerName,
      buyerId,
      cardData
    } = licenseData;

    const items = [{
      id: `license_${licenseType}`,
      name: `${licenseType.toUpperCase()} Panel Lisansı`,
      price: amount
    }];

    const billingAddress = {
      address: 'Test Adresi',
      city: 'İstanbul',
      zipCode: '34000'
    };

    const paymentData = {
      amount,
      currency: 'TRY',
      cardHolderName: cardData.cardHolderName,
      cardNumber: cardData.cardNumber,
      expireMonth: cardData.expireMonth,
      expireYear: cardData.expireYear,
      cvc: cardData.cvc,
      billingAddress,
      items,
      buyerEmail,
      buyerName,
      buyerId
    };

    return await this.processPayment(paymentData);
  }

  // Test ödeme (geliştirme için)
  async processTestPayment(amount = 100) {
    const testCardData = {
      cardHolderName: 'John Doe',
      cardNumber: '5528790000000008', // İyzico test kartı
      expireMonth: '12',
      expireYear: '2030',
      cvc: '123'
    };

    const testBillingAddress = {
      address: 'Test Mahallesi Test Sokak No:1',
      city: 'İstanbul',
      zipCode: '34000'
    };

    const testItems = [{
      id: 'test_product',
      name: 'Test Ürünü',
      price: amount
    }];

    const paymentData = {
      amount,
      currency: 'TRY',
      cardHolderName: testCardData.cardHolderName,
      cardNumber: testCardData.cardNumber,
      expireMonth: testCardData.expireMonth,
      expireYear: testCardData.expireYear,
      cvc: testCardData.cvc,
      billingAddress: testBillingAddress,
      items: testItems,
      buyerEmail: 'test@example.com',
      buyerName: 'Test Kullanıcı',
      buyerId: 'test_user_123'
    };

    return await this.processPayment(paymentData);
  }
}

module.exports = PaymentService; 