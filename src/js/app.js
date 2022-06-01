import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js"
import { getDatabase, child, ref, get, set } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-database.js"

var App = {
  web3Provider: null,
  contracts: {},
  newProductImageFile: null,
  firebaseDB: null,

  init: async function () {
    const firebaseConfig = {
      apiKey: "AIzaSyA7zK8l-fB05GUYclRQe9PsxrQxvFBJZZA",
      authDomain: "blockchain-smart-contract.firebaseapp.com",
      databaseURL: "https://blockchain-smart-contract-default-rtdb.firebaseio.com",
      projectId: "blockchain-smart-contract",
      storageBucket: "blockchain-smart-contract.appspot.com",
      messagingSenderId: "818880466047",
      appId: "1:818880466047:web:58a3f31815dd00ec52434a"
    }

    var firebaseApp = initializeApp(firebaseConfig)
    App.firebaseDB = getDatabase(firebaseApp)

    var productsRow = $('#productsRow')
    var productTemplate = $('#productTemplate')

    if (await App.getProductsData() == null) {
      $.getJSON('../products.json', function (data) {
        App.setProductsData(data)

        for (var i = 0; i < data.length; i++) {
          productTemplate.find('.panel-title').text(data[i].name)
          productTemplate.find('img').attr('src', data[i].picture)
          productTemplate.find('.product-brand').text(data[i].brand)
          productTemplate.find('.product-price').text(data[i].price)
          productTemplate.find('.btn-Buy').attr('data-id', data[i].id)

          productsRow.append(productTemplate.html())
        }
      })
    } else {
      var productData = await App.getProductsData()

      if (productData) {
        for (var i = 0; i < productData.length; i++) {
          productTemplate.find('.panel-title').text(productData[i].name)
          productTemplate.find('img').attr('src', productData[i].picture)
          productTemplate.find('.product-brand').text(productData[i].brand)
          productTemplate.find('.product-price').text(productData[i].price)
          productTemplate.find('.btn-Buy').attr('data-id', productData[i].id)

          productsRow.append(productTemplate.html())
        }
      }
    }

    const $form = $('.form')
    const $inputs = $form.find('#productNameInput, #productBrandInput, #productPriceInput')
    const $buttons = $form.find('#addProductSubmitButton')

    $form.on('input', function () {
      let areFieldsValid = true

      $.each($inputs, function () {
        const $input = $(this)
        if ($input.val() === '') {
          areFieldsValid = false
        }
      })

      if ($('input[type="file"]').val() == "") {
        areFieldsValid = false
      }

      $buttons.prop('disabled', !areFieldsValid)
    })

    $('input[type="file"]').change(function (e) {
      App.newProductImageFile = e.target.files[0]
    })

    return await App.initWeb3()
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum

      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });;
      } catch (error) {
        console.error("User denied account access")
      }
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider
    } else {
      App.web3Provider = new Web3.providers.HttpProvider("http://localhost:7545")
    }

    web3 = new Web3(App.web3Provider)

    return App.initContract()
  },

  initContract: function () {
    $.getJSON('Marketplace.json', function (data) {
      var MarketplaceArtifact = data
      App.contracts.Marketplace = TruffleContract(MarketplaceArtifact)

      App.contracts.Marketplace.setProvider(App.web3Provider)

      App.initProductsOwners()
      App.setDashboardButtonVisibility()

      return App.markBought()
    })

    return App.bindEvents()
  },

  initProductsOwners: function () {
    var marketplaceInstance

    App.contracts.Marketplace.deployed().then(function (instance) {
      marketplaceInstance = instance

      return marketplaceInstance.getSellers.call()
    }).then(function (sellers) {
      console.log("sellers: ", sellers)

      for (var i = 0; i < sellers.length; i++) {
        $('.panel-product').eq(i).find('.product-seller').text(sellers[i])
      }
    }).catch(function (err) {
      console.log(err.message)
    })
  },

  bindEvents: function () {
    $(document).on('click', '.btn-Buy', App.handleBuy)
    $(document).on('click', '.btn-primary', App.addproduct)
    $(document).on('click', '#dashboardButton', App.fillDashboardData)
  },

  markBought: function () {
    var marketplaceInstance

    App.contracts.Marketplace.deployed().then(function (instance) {
      marketplaceInstance = instance

      return marketplaceInstance.getBuyers.call()
    }).then(function (buyers) {
      console.log("buyers", buyers)

      for (var i = 0; i < buyers.length; i++) {
        if (buyers[i] !== "0x0000000000000000000000000000000000000000") {
          $('.panel-product').eq(i).find('button').text('Success').attr('disabled', true)
        }
      }
    }).catch(function (err) {
      console.log(err.message)
    })
  },

  handleBuy: function (event) {
    event.preventDefault()

    var productId = parseInt($(event.target).data('id'))

    var marketplaceInstance

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) {
        console.log(error)
      }

      var account = accounts[0]

      var productData = await App.getProductsData()
      productData = productData[productId]

      var sellerWallet = $('.panel-product').eq(productId).find('.product-seller').text()

      web3.eth.sendTransaction({
        from: account,
        to: sellerWallet,
        value: web3.toWei(productData.price, "ether")
      }, function (error, hash) {
        if (!error)
          console.log(hash + "success")
      })

      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance

        return marketplaceInstance.buy(productId, { from: account })
      }).then(function (result) {
        return App.markBought()
      }).catch(function (err) {
        console.log(err.message)
      })
    })
  },

  addproduct: async function (event) {
    event.preventDefault()

    const $form = $('.form')
    const name = $form.find('#productNameInput').val()
    const brand = $form.find('#productBrandInput').val()
    const price = $form.find('#productPriceInput').val()
    var image = null
    var newProductIndex = await App.getProductsDataSize()

    var productsRow = $('#productsRow')
    var productTemplate = $('#productTemplate')

    const fileReader = new FileReader()

    fileReader.readAsDataURL(App.newProductImageFile)
    fileReader.onload = async function () {
      image = fileReader.result

      var newProductData = {
        "id": newProductIndex,
        "name": name,
        "picture": image,
        "price": price,
        "brand": brand
      }

      await App.addProductData(newProductIndex, newProductData)

      productTemplate.find('.panel-title').text(name)
      productTemplate.find('img').attr('src', image)
      productTemplate.find('.product-brand').text(brand)
      productTemplate.find('.product-price').text(price)
      productTemplate.find('.btn-Buy').attr('data-id', newProductIndex)

      productsRow.append(productTemplate.html())
    }

    var marketplaceInstance

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error)
      }

      var account = accounts[0]

      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance

        return marketplaceInstance.addProduct(newProductIndex, { from: account })
      }).then(function (result) {
        return App.initProductsOwners()
      }).catch(function (err) {
        console.log(err.message)
      })
    })
  },

  setDashboardButtonVisibility: async function () {
    web3.eth.getAccounts(function (err, accounts) {
      if (err) {
        console.log(err)
      } else {
        var account = accounts[0]
        console.log(account)

        if (account == "0xb536f83f3e4ecc0280a86bb7067af81e3c7ffe4d") {
          $('#showDashBoardButton').show()
        } else {
          $('#showDashBoardButton').hide()
        }
      }
    })

    ethereum.on('accountsChanged', function (accounts) {
      web3.eth.getAccounts(function (err, accounts) {
        if (err) {
          console.log(err)
        } else {
          var account = accounts[0]

          if (account == "0xb536f83f3e4ecc0280a86bb7067af81e3c7ffe4d") {
            $('#showDashBoardButton').show()
          } else {
            $('#showDashBoardButton').hide()
          }
        }
      })
    })
  },

  fillDashboardData: async function (event) {
    event.preventDefault()

    var totalSells = await App.getProductsSoldCount()
    var totalSellsPrice = await App.getTotalSoldInEth()

    $('#totalSells').text(totalSells)
    $('#totalSellsPrice').text(totalSellsPrice + " ETH")
  },

  getProductsData: async function () {
    const dbRef = ref(App.firebaseDB)

    return get(child(dbRef, `productsData`)).then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val()
      } else {
        return null
      }
    }).catch((error) => {
      console.error(error)
    })
  },

  getProductsDataSize: async function () {
    const dbRef = ref(App.firebaseDB)

    return get(child(dbRef, `productsData`)).then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val().length
      } else {
        return null
      }
    }).catch((error) => {
      console.error(error)
    })
  },

  setProductsData: function (productsData) {
    set(ref(App.firebaseDB, '/'), {
      productsData
    })
  },

  addProductData: function (productId, productData) {
    set(ref(App.firebaseDB, '/productsData/' + productId), productData)
  },

  getProductsBuyers: async function () {
    var marketplaceInstance
    var productsBuyers = null

    await App.contracts.Marketplace.deployed().then(function (instance) {
      marketplaceInstance = instance

      return marketplaceInstance.getBuyers.call()
    }).then(function (buyers) {
      productsBuyers = buyers
    }).catch(function (err) {
      console.log(err.message)
    })

    return productsBuyers
  },

  getProductsSoldCount: async function () {
    var marketplaceInstance
    var count = 0

    await App.contracts.Marketplace.deployed().then(function (instance) {
      marketplaceInstance = instance

      return marketplaceInstance.getBuyers.call()
    }).then(function (buyers) {

      for (var i = 0; i < buyers.length; i++) {
        if (buyers[i] !== "0x0000000000000000000000000000000000000000") {
          count++
        }
      }
    }).catch(function (err) {
      console.log(err.message)
    })

    return count
  },

  getTotalSoldInEth: async function () {
    var buyers = await App.getProductsBuyers()
    var productsData = await App.getProductsData()

    var totalSoldInETH = 0

    for (var i = 0; i < buyers.length; i++) {
      if (buyers[i] !== "0x0000000000000000000000000000000000000000") {
        totalSoldInETH += productsData[i].price
      }
    }

    return totalSoldInETH
  }
}

$(function () {
  $(window).load(function () {
    App.init()
  })
})