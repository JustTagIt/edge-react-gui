// @flow

import { type EdgeSpendInfo, type EdgeTransaction, errorNames } from 'edge-core-js'
import { connect } from 'react-redux'

import {
  newPin,
  newSpendInfo,
  reset,
  sendConfirmationUpdateTx,
  signBroadcastAndSave,
  updateAmount,
  updateSpendPending,
  updateTransaction
} from '../../actions/SendConfirmationActions.js'
import { activated as uniqueIdentifierModalActivated } from '../../actions/UniqueIdentifierModalActions.js'
import { SendConfirmation } from '../../components/scenes/SendConfirmationScene'
import type { SendConfirmationDispatchProps, SendConfirmationStateProps } from '../../components/scenes/SendConfirmationScene'
import { getWallet } from '../../modules/Core/selectors.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import { getDisplayDenomination, getExchangeDenomination as settingsGetExchangeDenomination } from '../../modules/Settings/selectors.js'
import {
  getError,
  getForceUpdateGuiCounter,
  getKeyboardIsVisible,
  getPending,
  getPublicAddress,
  getTransaction
} from '../../modules/UI/scenes/SendConfirmation/selectors'
import type { AuthType } from '../../modules/UI/scenes/SendConfirmation/selectors.js'
import { convertCurrency, getExchangeDenomination, getExchangeRate, getSelectedCurrencyCode, getSelectedWallet } from '../../modules/UI/selectors.js'
import { type GuiMakeSpendInfo } from '../../reducers/scenes/SendConfirmationReducer.js'
import { convertNativeToExchange } from '../../util/utils'

const mapStateToProps = (state: State): SendConfirmationStateProps => {
  const sceneState = state.ui.scenes.sendConfirmation
  let fiatPerCrypto = 0
  let secondaryExchangeCurrencyCode = ''
  const guiWallet = getSelectedWallet(state)
  const coreWallet = getWallet(state, guiWallet.id)
  const currencyCode = getSelectedCurrencyCode(state)
  const balanceInCrypto = guiWallet.nativeBalances[currencyCode]

  const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
  const exchangeDenomination = settingsGetExchangeDenomination(state, currencyCode)
  const balanceInCryptoDisplay = convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  const balanceInFiat = fiatPerCrypto * parseFloat(balanceInCryptoDisplay)

  if (guiWallet) {
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    secondaryExchangeCurrencyCode = isoFiatCurrencyCode
  }

  const transaction = getTransaction(state)
  const pending = getPending(state)
  const nativeAmount = sceneState.nativeAmount
  // const nativeAmount = getNativeAmount(state)
  let error = getError(state)

  let errorMsg = null
  let resetSlider = false
  if (error && error.message === 'broadcastError') {
    error = null
    resetSlider = true
  }
  errorMsg = error ? error.message : ''
  if (error && error.name === errorNames.NoAmountSpecifiedError) errorMsg = ''
  const networkFee = transaction ? transaction.networkFee : null
  const parentNetworkFee = transaction && transaction.parentNetworkFee ? transaction.parentNetworkFee : null
  const uniqueIdentifier = sceneState.guiMakeSpendInfo.uniqueIdentifier
  const transactionMetadata = sceneState.transactionMetadata
  const exchangeRates = state.exchangeRates

  const { spendingLimits } = state.ui.settings
  const defaultIsoFiatCurrencyCode = state.ui.settings.defaultIsoFiat
  const nativeToExchangeRatio = getExchangeDenomination(state, currencyCode).multiplier
  const exchangeAmount = convertNativeToExchange(nativeToExchangeRatio)(nativeAmount)
  const fiatAmount = convertCurrency(state, currencyCode, defaultIsoFiatCurrencyCode, parseFloat(exchangeAmount))
  const exceedsLimit = fiatAmount >= spendingLimits.transaction.amount

  const out = {
    balanceInCrypto,
    balanceInFiat,
    currencyCode,
    transactionMetadata,
    errorMsg,
    exchangeRates,
    fiatCurrencyCode: guiWallet.fiatCurrencyCode,
    fiatPerCrypto,
    forceUpdateGuiCounter: getForceUpdateGuiCounter(state),
    isEditable: sceneState.isEditable,
    keyboardIsVisible: getKeyboardIsVisible(state),
    nativeAmount,
    networkFee,
    parentDisplayDenomination: getDisplayDenomination(state, guiWallet.currencyCode),
    parentExchangeDenomination: getExchangeDenomination(state, guiWallet.currencyCode),
    parentNetworkFee,
    pending,
    primaryDisplayDenomination: getDisplayDenomination(state, currencyCode),
    primaryExchangeDenomination: getExchangeDenomination(state, currencyCode),
    publicAddress: getPublicAddress(state),
    resetSlider,
    secondaryExchangeCurrencyCode,
    sliderDisabled: !transaction || !!error || !!pending,
    uniqueIdentifier,
    authRequired: state.ui.scenes.sendConfirmation.authRequired,
    address: state.ui.scenes.sendConfirmation.address,
    isLimitExceeded: exceedsLimit ? 'pin' : 'none',
    sceneState,
    coreWallet
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): SendConfirmationDispatchProps => ({
  updateAmount: (nativeAmount: string, exchangeAmount: string, fiatPerCrypto: string) => {
    return dispatch(updateAmount(nativeAmount, exchangeAmount, fiatPerCrypto))
  },
  sendConfirmationUpdateTx: guiMakeSpendInfo => dispatch(sendConfirmationUpdateTx(guiMakeSpendInfo)),
  reset: () => dispatch(reset()),
  updateSpendPending: (pending: boolean): any => dispatch(updateSpendPending(pending)),
  signBroadcastAndSave: (nativeAmount: string, exchangeAmount: string, fiatPerCrypto: string): any =>
    dispatch(signBroadcastAndSave(nativeAmount, exchangeAmount, fiatPerCrypto)),
  onChangePin: (pin: string) => dispatch(newPin(pin)),
  uniqueIdentifierButtonPressed: () => {
    dispatch(uniqueIdentifierModalActivated())
  },
  newSpendInfo: (spendInfo: EdgeSpendInfo, isLimitExceeded: AuthType) => dispatch(newSpendInfo(spendInfo, isLimitExceeded)),
  updateTransaction: (transaction: ?EdgeTransaction, guiMakeSpendInfo: ?GuiMakeSpendInfo, forceUpdateGui: ?boolean, error: ?Error) => {
    dispatch(updateTransaction(transaction, guiMakeSpendInfo, forceUpdateGui, error))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SendConfirmation)
